import { createReadStream, existsSync } from 'node:fs';
import { receita } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { normalizarNome } from '@alupa/domain';
import type { Armazenamento } from '@alupa/storage';
import { eq, sql } from 'drizzle-orm';
import { Unzip, UnzipInflate, unzipSync } from 'fflate';
import type { Logger } from 'pino';

const { documentoOriginal, documentoPessoa, fonte, participacaoSocietaria, pessoa } = schema;

const METODO = 'nome civil + 6 dígitos centrais do CPF';

/** Chave de comparação: nome normalizado e os 6 dígitos que a Receita publica. */
const chave = (nome: string, digitos: string) => `${normalizarNome(nome)}|${digitos}`;

/**
 * Cópia independente de um registro lido do arquivo. No V8, um trecho de string (slice) mantém
 * viva a string inteira de onde saiu (aqui, um bloco descomprimido de vários MB). Guardar milhares
 * de registros sem copiar esgota a memória; copie tudo o que sobreviver à leitura da linha.
 */
export const copiar = <T>(registro: T): T => JSON.parse(JSON.stringify(registro)) as T;

/**
 * Lê as linhas de um CSV dentro de um ZIP, em fluxo. Cada linha é entregue a `aoLer` assim que
 * sai do descompressor, sem fila intermediária: a memória usada não cresce com o arquivo.
 */
export async function lerLinhasDoZip(caminho: string, aoLer: (linha: string) => void) {
  let resto = '';
  let erro: unknown = null;
  const decodificador = new TextDecoder('latin1');

  const unzip = new Unzip((arquivo) => {
    arquivo.ondata = (e, dados, final) => {
      if (e) {
        erro = e;
        return;
      }
      resto += decodificador.decode(dados, { stream: !final });
      let inicio = 0;
      for (let fim = resto.indexOf('\n'); fim !== -1; fim = resto.indexOf('\n', inicio)) {
        aoLer(resto.slice(inicio, fim).replace(/\r$/, ''));
        inicio = fim + 1;
      }
      resto = resto.slice(inicio);
      if (final && resto) {
        aoLer(resto);
        resto = '';
      }
    };
    arquivo.start();
  });
  unzip.register(UnzipInflate);

  for await (const pedaco of createReadStream(caminho, { highWaterMark: 1 << 20 })) {
    unzip.push(pedaco as Uint8Array);
    if (erro) throw erro;
  }
  unzip.push(new Uint8Array(0), true);
  if (erro) throw erro;
}

export async function guardarArquivo(
  db: Database,
  armazenamento: Armazenamento,
  fonteId: string,
  mes: string,
  arquivo: string,
  log: Logger,
) {
  const chaveStorage = `receita/cnpj/${mes}/${arquivo}`;
  const url = receita.urlArquivo(mes, arquivo);
  const [existente] = await db
    .select({ id: documentoOriginal.id })
    .from(documentoOriginal)
    .where(eq(documentoOriginal.chaveStorage, chaveStorage));
  if (existente && existsSync(armazenamento.caminhoLocal(chaveStorage))) {
    return { documentoId: existente.id, caminho: armazenamento.caminhoLocal(chaveStorage) };
  }

  log.info({ mes, arquivo }, 'baixando da Receita');
  const { fluxo } = await receita.baixarFluxo(mes, arquivo);
  const guardado = await armazenamento.guardarFluxo(chaveStorage, fluxo, 'application/zip');
  const [doc] = await db
    .insert(documentoOriginal)
    .values({
      fonteId,
      url,
      idNaFonte: chaveStorage,
      sha256: guardado.sha256,
      chaveStorage,
      contentType: guardado.contentType,
      tamanhoBytes: guardado.tamanhoBytes,
    })
    .onConflictDoUpdate({
      target: [documentoOriginal.fonteId, documentoOriginal.sha256],
      set: { obtidoEm: sql`now()` },
    })
    .returning({ id: documentoOriginal.id });
  return { documentoId: doc!.id, caminho: armazenamento.caminhoLocal(chaveStorage) };
}

/** Tabela de qualificações de sócio (código → descrição), pequena e lida inteira. */
export async function tabelaAuxiliar(mes: string, arquivo: string) {
  const { fluxo } = await receita.baixarFluxo(mes, arquivo);
  const partes: Uint8Array[] = [];
  for await (const p of fluxo) partes.push(p);
  const zip = unzipSync(Buffer.concat(partes));
  const texto = new TextDecoder('latin1').decode(Object.values(zip)[0]!);
  return new Map(
    texto
      .split(/\r?\n/)
      .filter(Boolean)
      .map((l) => receita.camposReceita(l))
      .map(([codigo, descricao]) => [codigo!.trim(), descricao!.trim()] as const),
  );
}

/**
 * Procura, no quadro de sócios da Receita, as pessoas cujo CPF já conhecemos.
 * Só guarda as correspondências; o resto do arquivo é descartado durante a leitura.
 */
export async function cruzarSocios(
  db: Database,
  armazenamento: Armazenamento,
  mes: string,
  log: Logger,
) {
  const [fonteReceita] = await db
    .select({ id: fonte.id })
    .from(fonte)
    .where(eq(fonte.codigo, 'receita-cnpj'));
  if (!fonteReceita) throw new Error('Fonte "receita-cnpj" não cadastrada. Rode pnpm db:seed.');

  // Índice das pessoas com CPF conhecido: nome civil + 6 dígitos centrais.
  const pessoas = await db
    .select({
      id: pessoa.id,
      nome: pessoa.nome,
      nomeCompleto: pessoa.nomeCompleto,
      cpfMascarado: documentoPessoa.cpfMascarado,
    })
    .from(documentoPessoa)
    .innerJoin(pessoa, eq(pessoa.id, documentoPessoa.pessoaId));

  const indice = new Map<string, string[]>();
  for (const p of pessoas) {
    const digitos = p.cpfMascarado.replace(/\D/g, '');
    if (digitos.length !== 6) continue;
    const k = chave(p.nomeCompleto ?? p.nome, digitos);
    indice.set(k, [...(indice.get(k) ?? []), p.id]);
  }
  log.info({ pessoas: indice.size, mes }, 'índice de pessoas montado');

  const descricaoQualificacao = await tabelaAuxiliar(mes, 'Qualificacoes.zip');
  let linhasLidas = 0;
  let encontradas = 0;

  for (const arquivo of receita.PARTES_SOCIOS) {
    const { documentoId, caminho } = await guardarArquivo(
      db,
      armazenamento,
      fonteReceita.id,
      mes,
      arquivo,
      log,
    );

    const achados: (typeof participacaoSocietaria.$inferInsert)[] = [];
    await lerLinhasDoZip(caminho, (linha) => {
      linhasLidas++;
      const s = receita.lerLinhaSocio(linha);
      if (!s || s.identificador !== 2) return;
      const digitos = s.documento.match(/^\*{3}(\d{6})\*{2}$/)?.[1];
      if (!digitos) return;
      const ids = indice.get(chave(s.nome, digitos));
      if (!ids) return;
      // Duas pessoas nossas com o mesmo nome e dígitos: ambígua, não ligamos ninguém.
      if (ids.length > 1) {
        log.warn({ cnpjBasico: s.cnpjBasico, candidatos: ids.length }, 'correspondência ambígua');
        return;
      }
      achados.push(
        copiar({
          pessoaId: ids[0]!,
          cnpjBasico: s.cnpjBasico,
          nomeNaFonte: s.nome,
          cpfParcial: s.documento,
          qualificacaoCodigo: s.qualificacao,
          qualificacao:
            descricaoQualificacao.get(String(s.qualificacao).padStart(2, '0')) ??
            descricaoQualificacao.get(String(s.qualificacao)) ??
            null,
          entradaEm: receita.dataReceita(s.entrada),
          faixaEtaria: Number.isFinite(s.faixaEtaria) ? s.faixaEtaria : null,
          metodo: METODO,
          confianca: 'possivel',
          referencia: mes,
          documentoOriginalId: documentoId,
        }),
      );
    });

    for (let i = 0; i < achados.length; i += 500) {
      await db
        .insert(participacaoSocietaria)
        .values(achados.slice(i, i + 500))
        .onConflictDoUpdate({
          target: [
            participacaoSocietaria.pessoaId,
            participacaoSocietaria.cnpjBasico,
            participacaoSocietaria.qualificacaoCodigo,
            participacaoSocietaria.referencia,
          ],
          set: {
            entradaEm: sql`excluded.entrada_em`,
            qualificacao: sql`excluded.qualificacao`,
            documentoOriginalId: sql`excluded.documento_original_id`,
            atualizadoEm: sql`now()`,
          },
        });
    }
    encontradas += achados.length;
    log.info({ arquivo, linhasLidas, encontradas }, 'parte processada');
  }

  return { mes, linhasLidas, participacoes: encontradas };
}
