import { tse, baixar } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { slugify } from '@alupa/domain';
import { apenasDigitos } from '@alupa/domain';
import { chaveDeIdentidade, chaveDeTitulo, cifrar, mascararCpf } from '@alupa/domain/identidade';
import type { Armazenamento } from '@alupa/storage';
import { parse } from 'csv-parse/sync';
import { eq, inArray, sql } from 'drizzle-orm';
import { unzipSync } from 'fflate';
import type { Logger } from 'pino';

const {
  bemDeclarado,
  candidatura,
  documentoOriginal,
  documentoPessoa,
  fonte,
  identificadorExterno,
  pessoa,
} = schema;

type Linha = Record<string, string>;

const LOTE = 500;
const lotes = <T>(itens: T[], n = LOTE) =>
  Array.from({ length: Math.ceil(itens.length / n) }, (_, i) => itens.slice(i * n, (i + 1) * n));

/** CSVs do TSE: Latin-1, ";" e aspas. */
function lerCsv(bytes: Uint8Array): Linha[] {
  return parse(new TextDecoder('latin1').decode(bytes), {
    delimiter: ';',
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as Linha[];
}

/** Lista os CSVs por UF do ZIP sem descomprimir o resto. */
function csvsDoZip(zip: Uint8Array, prefixo: string, ufs: Set<string> | null) {
  const nomes: string[] = [];
  unzipSync(zip, {
    filter: (f) => {
      const uf = f.name.match(/_([A-Z]{2})\.csv$/i)?.[1]?.toUpperCase();
      if (tse.ehCsvDeUf(f.name, prefixo) && uf && (!ufs || ufs.has(uf))) nomes.push(f.name);
      return false;
    },
  });
  return nomes.sort();
}

const descomprimir = (zip: Uint8Array, nome: string) =>
  unzipSync(zip, { filter: (f) => f.name === nome })[nome]!;

async function guardarOriginal(
  db: Database,
  armazenamento: Armazenamento,
  fonteId: string,
  url: string,
  chave: string,
) {
  const arquivo = await baixar(url);
  const guardado = await armazenamento.guardar(chave, arquivo.bytes, arquivo.contentType);
  const [doc] = await db
    .insert(documentoOriginal)
    .values({
      fonteId,
      url,
      idNaFonte: chave,
      sha256: guardado.sha256,
      chaveStorage: guardado.chave,
      contentType: guardado.contentType,
      tamanhoBytes: guardado.tamanhoBytes,
    })
    .onConflictDoUpdate({
      target: [documentoOriginal.fonteId, documentoOriginal.sha256],
      set: { obtidoEm: sql`now()` },
    })
    .returning({ id: documentoOriginal.id });
  return { bytes: arquivo.bytes, documentoId: doc!.id };
}

export interface OpcoesImportacao {
  ano: number;
  /** UFs a importar; null importa todas. */
  ufs: string[] | null;
  /** Códigos de cargo do TSE; null importa todos. */
  cargos: number[] | null;
  segredo: string;
  /** Chave AES-256 (ALUPA_CHAVE_CIFRA) para guardar o CPF completo cifrado. */
  chaveCifra: string;
}

/**
 * Importa candidaturas e bens declarados de uma eleição.
 * Idempotente: candidaturas por (ano, SQ_CANDIDATO); bens são substituídos a cada importação.
 * Pessoas são ligadas pela chave de identidade (HMAC do CPF); o CPF não é gravado.
 */
export async function importarEleicao(
  db: Database,
  armazenamento: Armazenamento,
  opcoes: OpcoesImportacao,
  log: Logger,
) {
  const { ano, segredo, chaveCifra } = opcoes;
  const ufs = opcoes.ufs ? new Set(opcoes.ufs.map((u) => u.toUpperCase())) : null;
  const cargos = opcoes.cargos ? new Set(opcoes.cargos) : null;

  const [fonteTse] = await db.select({ id: fonte.id }).from(fonte).where(eq(fonte.codigo, 'tse'));
  if (!fonteTse) throw new Error('Fonte "tse" não cadastrada. Rode pnpm db:seed.');

  log.info({ ano }, 'baixando arquivos do TSE');
  const [candidatos, bens] = await Promise.all([
    guardarOriginal(
      db,
      armazenamento,
      fonteTse.id,
      tse.urlCandidatos(ano),
      `tse/${ano}/consulta_cand_${ano}.zip`,
    ),
    guardarOriginal(
      db,
      armazenamento,
      fonteTse.id,
      tse.urlBens(ano),
      `tse/${ano}/bem_candidato_${ano}.zip`,
    ),
  ]);

  // Pessoas já conhecidas por qualquer chave ("cpf_hmac:…" ou "titulo_hmac:…"), e slugs usados.
  const conhecidas = new Map(
    (
      await db
        .select({
          sistema: identificadorExterno.sistema,
          chave: identificadorExterno.valor,
          id: identificadorExterno.entidadeId,
        })
        .from(identificadorExterno)
        .where(inArray(identificadorExterno.sistema, ['cpf_hmac', 'titulo_hmac']))
    ).map((r) => [`${r.sistema}:${r.chave}`, r.id]),
  );
  const slugs = new Set((await db.select({ slug: pessoa.slug }).from(pessoa)).map((p) => p.slug));

  let totalCandidaturas = 0;
  let totalBens = 0;
  let novasPessoas = 0;
  let semIdentidade = 0;

  for (const nomeCsv of csvsDoZip(candidatos.bytes, `consulta_cand_${ano}`, ufs)) {
    const uf = nomeCsv.match(/_([A-Z]{2})\.csv$/i)![1]!.toUpperCase();

    // Uma linha por turno: fica a do último turno (resultado final).
    const porSq = new Map<string, Linha>();
    for (const l of lerCsv(descomprimir(candidatos.bytes, nomeCsv))) {
      if (cargos && !cargos.has(Number(l.CD_CARGO))) continue;
      const atual = porSq.get(l.SQ_CANDIDATO!);
      if (!atual || Number(l.NR_TURNO) > Number(atual.NR_TURNO)) porSq.set(l.SQ_CANDIDATO!, l);
    }
    if (porSq.size === 0) continue;

    const nomeBens = nomeCsv.replace('consulta_cand', 'bem_candidato');
    const bensPorSq = new Map<string, Linha[]>();
    try {
      for (const b of lerCsv(descomprimir(bens.bytes, nomeBens))) {
        if (!porSq.has(b.SQ_CANDIDATO!)) continue;
        const lista = bensPorSq.get(b.SQ_CANDIDATO!);
        if (lista) lista.push(b);
        else bensPorSq.set(b.SQ_CANDIDATO!, [b]);
      }
    } catch {
      log.warn({ ano, uf }, 'arquivo de bens ausente para a UF');
    }

    for (const lote of lotes([...porSq.values()])) {
      await db.transaction(async (tx) => {
        // 1. Pessoas: reaproveita pela chave de identidade; cria as que faltam.
        // Inserções em lote: uma ida ao banco por lote, não por candidato.
        const idPorSq = new Map<string, string>();
        // Chaves a registrar para pessoas já existentes que ainda não as têm.
        const chavesFaltantes: { sistema: string; valor: string; entidadeId: string }[] = [];
        // Pessoas novas do lote, indexadas por "provisório" até receberem id.
        const novas = new Map<
          string,
          { nome: string; nomeCompleto: string; slug: string; chaves: string[]; sqs: string[] }
        >();

        for (const l of lote) {
          const chaves = [
            chaveDeIdentidade(l.NR_CPF_CANDIDATO, segredo),
            chaveDeTitulo(l.NR_TITULO_ELEITORAL_CANDIDATO, segredo),
          ]
            .map((c, i) => (c ? `${i === 0 ? 'cpf_hmac' : 'titulo_hmac'}:${c}` : null))
            .filter((c): c is string => c !== null);
          if (chaves.length === 0) semIdentidade++;

          const existente = chaves.map((c) => conhecidas.get(c)).find(Boolean);
          if (existente) {
            idPorSq.set(l.SQ_CANDIDATO!, existente);
            for (const c of chaves) {
              if (!conhecidas.has(c)) {
                const [sistema, valor] = c.split(':') as [string, string];
                chavesFaltantes.push({ sistema, valor, entidadeId: existente });
                conhecidas.set(c, existente);
              }
            }
            continue;
          }

          // Mesma pessoa duas vezes no lote (ex.: candidaturas a cargos diferentes).
          const repetida = [...novas.values()].find((n) =>
            n.chaves.some((c) => chaves.includes(c)),
          );
          if (repetida) {
            repetida.sqs.push(l.SQ_CANDIDATO!);
            for (const c of chaves) if (!repetida.chaves.includes(c)) repetida.chaves.push(c);
            continue;
          }

          const nome = tse.valorTse(l.NM_URNA_CANDIDATO) ?? l.NM_CANDIDATO!;
          let slug = `${slugify(nome)}-${uf.toLowerCase()}`;
          if (slugs.has(slug)) slug = `${slug}-${l.SQ_CANDIDATO}`;
          slugs.add(slug);
          novas.set(slug, {
            nome: tituloProprio(nome),
            nomeCompleto: tituloProprio(l.NM_CANDIDATO!),
            slug,
            chaves,
            sqs: [l.SQ_CANDIDATO!],
          });
        }

        if (novas.size > 0) {
          const criadas = await tx
            .insert(pessoa)
            .values(
              [...novas.values()].map(({ nome, nomeCompleto, slug }) => ({
                nome,
                nomeCompleto,
                slug,
              })),
            )
            .returning({ id: pessoa.id, slug: pessoa.slug });
          novasPessoas += criadas.length;
          for (const c of criadas) {
            const n = novas.get(c.slug)!;
            for (const sq of n.sqs) idPorSq.set(sq, c.id);
            for (const chave of n.chaves) {
              const [sistema, valor] = chave.split(':') as [string, string];
              chavesFaltantes.push({ sistema, valor, entidadeId: c.id });
              conhecidas.set(chave, c.id);
            }
          }
        }

        if (chavesFaltantes.length > 0) {
          await tx
            .insert(identificadorExterno)
            .values(chavesFaltantes.map((c) => ({ ...c, entidadeTipo: 'pessoa' })))
            .onConflictDoNothing();
        }

        // CPF completo só cifrado, no schema restrito; o mascarado serve para cruzar com a Receita.
        const documentos = new Map<string, typeof documentoPessoa.$inferInsert>();
        for (const l of lote) {
          const cpf = apenasDigitos(l.NR_CPF_CANDIDATO ?? '');
          const mascarado = mascararCpf(cpf);
          const pessoaId = idPorSq.get(l.SQ_CANDIDATO!);
          if (!pessoaId || !mascarado || !chaveDeIdentidade(cpf, segredo)) continue;
          documentos.set(pessoaId, {
            pessoaId,
            cpfCifrado: cifrar(cpf, chaveCifra),
            cpfMascarado: mascarado,
            fonte: `tse:${ano}`,
          });
        }
        if (documentos.size > 0) {
          await tx
            .insert(documentoPessoa)
            .values([...documentos.values()])
            .onConflictDoUpdate({
              target: documentoPessoa.pessoaId,
              set: {
                cpfCifrado: sql`excluded.cpf_cifrado`,
                cpfMascarado: sql`excluded.cpf_mascarado`,
                fonte: sql`excluded.fonte`,
                atualizadoEm: sql`now()`,
              },
            });
        }

        // 2. Candidaturas.
        const gravadas = await tx
          .insert(candidatura)
          .values(
            lote.map((l) => {
              const itens = bensPorSq.get(l.SQ_CANDIDATO!) ?? [];
              const total = itens.reduce(
                (s, b) => s + Number(tse.reaisTse(b.VR_BEM_CANDIDATO) ?? 0),
                0,
              );
              return {
                pessoaId: idPorSq.get(l.SQ_CANDIDATO!)!,
                ano,
                sqCandidato: l.SQ_CANDIDATO!,
                codigoEleicao: l.CD_ELEICAO!,
                turno: Number(l.NR_TURNO) || null,
                cargo: l.DS_CARGO!,
                codigoCargo: Number(l.CD_CARGO),
                siglaUf: uf,
                unidadeEleitoral: l.SG_UE!,
                unidadeEleitoralNome: tse.valorTse(l.NM_UE),
                numero: tse.valorTse(l.NR_CANDIDATO),
                nomeUrna: tse.valorTse(l.NM_URNA_CANDIDATO) ?? l.NM_CANDIDATO!,
                partido: tse.valorTse(l.SG_PARTIDO),
                ocupacao: tse.valorTse(l.DS_OCUPACAO),
                situacaoCandidatura: tse.valorTse(l.DS_SITUACAO_CANDIDATURA),
                resultado: tse.valorTse(l.DS_SIT_TOT_TURNO),
                totalBensDeclarados: itens.length ? total.toFixed(2) : null,
                quantidadeBens: itens.length,
                fonteUrl: tse.urlCandidatos(ano),
                geradoNaFonteEm: tse.valorTse(l.DT_GERACAO),
              };
            }),
          )
          .onConflictDoUpdate({
            target: [candidatura.ano, candidatura.sqCandidato],
            set: {
              pessoaId: sql`excluded.pessoa_id`,
              turno: sql`excluded.turno`,
              partido: sql`excluded.partido`,
              ocupacao: sql`excluded.ocupacao`,
              situacaoCandidatura: sql`excluded.situacao_candidatura`,
              resultado: sql`excluded.resultado`,
              totalBensDeclarados: sql`excluded.total_bens_declarados`,
              quantidadeBens: sql`excluded.quantidade_bens`,
              geradoNaFonteEm: sql`excluded.gerado_na_fonte_em`,
              atualizadoEm: sql`now()`,
            },
          })
          .returning({ id: candidatura.id, sq: candidatura.sqCandidato });

        // 3. Bens: substituídos integralmente, como na fonte.
        await tx.delete(bemDeclarado).where(
          inArray(
            bemDeclarado.candidaturaId,
            gravadas.map((g) => g.id),
          ),
        );
        const linhasBens = gravadas.flatMap((g) =>
          (bensPorSq.get(g.sq) ?? []).flatMap((b) => {
            const valor = tse.reaisTse(b.VR_BEM_CANDIDATO);
            if (valor == null) return [];
            return [
              {
                candidaturaId: g.id,
                ordem: Number(b.NR_ORDEM_BEM_CANDIDATO),
                codigoTipo: Number(b.CD_TIPO_BEM_CANDIDATO) || null,
                tipo: b.DS_TIPO_BEM_CANDIDATO!,
                descricao: tse.valorTse(b.DS_BEM_CANDIDATO),
                valor,
                atualizadoNaFonteEm: tse.valorTse(b.DT_ULT_ATUAL_BEM_CANDIDATO),
              },
            ];
          }),
        );
        for (const l of lotes(linhasBens, 1000)) {
          await tx.insert(bemDeclarado).values(l).onConflictDoNothing();
        }

        totalCandidaturas += gravadas.length;
        totalBens += linhasBens.length;
      });
    }
    log.info({ ano, uf, candidaturas: porSq.size }, 'UF importada');
  }

  return { ano, candidaturas: totalCandidaturas, bens: totalBens, novasPessoas, semIdentidade };
}

/** "DOUGLAS RUAS" → "Douglas Ruas", mantendo preposições em minúsculas. */
export function tituloProprio(nome: string): string {
  const minusculas = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}
