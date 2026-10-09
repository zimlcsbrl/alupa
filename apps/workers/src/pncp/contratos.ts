import { pncp } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { apenasDigitos } from '@alupa/domain';
import { type Armazenamento, sha256 } from '@alupa/storage';
import { gzipSync } from 'node:zlib';
import { and, eq, isNotNull, sql } from 'drizzle-orm';
import type { Logger } from 'pino';

const { checkpoint, coleta, contrato, documentoOriginal, fonte, participacaoSocietaria } = schema;

const PAUSA_MS = 300;
const pausa = () => new Promise((r) => setTimeout(r, PAUSA_MS));
const reais = (v: number | null | undefined) => (v == null ? null : v.toFixed(2));

/** Empresas acompanhadas: CNPJ básico → organização (das participações societárias). */
export async function carregarAlvos(db: Database) {
  const linhas = await db
    .selectDistinct({
      cnpjBasico: participacaoSocietaria.cnpjBasico,
      organizacaoId: participacaoSocietaria.organizacaoId,
    })
    .from(participacaoSocietaria)
    .where(isNotNull(participacaoSocietaria.organizacaoId));
  return new Map(linhas.map((l) => [l.cnpjBasico, l.organizacaoId!]));
}

/** Dias cuja coleta seletiva terminou sem erro. */
export async function diasConcluidos(db: Database) {
  const linhas = await db
    .selectDistinct({ dia: sql<string>`${coleta.parametros}->>'dia'` })
    .from(coleta)
    .where(
      and(eq(coleta.tarefa, 'pncp:contratos:publicacao'), eq(coleta.situacao, 'concluida')),
    );
  return new Set(linhas.map((l) => l.dia));
}

/**
 * Lê todos os contratos publicados em um dia e grava só os de fornecedores acompanhados.
 * Cada página lida é guardada como original, mesmo sem contratos de interesse.
 */
export async function coletarContratosDia(
  db: Database,
  armazenamento: Armazenamento,
  alvos: Map<string, string>,
  dia: string,
  log: Logger,
) {
  const [fontePncp] = await db.select({ id: fonte.id }).from(fonte).where(eq(fonte.codigo, 'pncp'));
  if (!fontePncp) throw new Error('Fonte "pncp" não cadastrada.');

  const [execucao] = await db
    .insert(coleta)
    .values({
      fonteId: fontePncp.id,
      tarefa: 'pncp:contratos:publicacao',
      situacao: 'em_execucao',
      parametros: { dia, seletiva: true, fornecedoresAcompanhados: alvos.size },
      iniciadaEm: new Date(),
    })
    .returning({ id: coleta.id });

  let lidos = 0;
  let gravados = 0;
  try {
    for (let pagina = 1, total = 1; pagina <= total; pagina++) {
      const r = await pncp.contratosPublicados(dia, pagina);
      total = r.totalPaginas;
      lidos += r.contratos.length;

      const deInteresse = r.contratos.filter((c) => {
        const ni = apenasDigitos(c.niFornecedor ?? '');
        return c.tipoPessoa === 'PJ' && ni.length === 14 && alvos.has(ni.slice(0, 8));
      });

      // Guardamos o original só do que publicamos: o registro exato de cada contrato gravado,
      // comprimido. Páginas sem contratos de interesse não são guardadas (podem ser relidas).
      if (deInteresse.length > 0) {
        const brutos = new Map(
          (JSON.parse(r.resposta.texto) as { data: Record<string, unknown>[] }).data.map((b) => [
            String(b.numeroControlePNCP),
            b,
          ]),
        );

        for (const c of deInteresse) {
          const cnpj = apenasDigitos(c.niFornecedor!);
          const publicadoEm = pncp.dataPncp(c.dataPublicacaoPncp);
          if (!publicadoEm) continue;

          const registro = JSON.stringify(brutos.get(c.numeroControlePNCP));
          const hash = sha256(registro);
          const guardado = await armazenamento.guardar(
            `pncp/contratos/registros/${c.numeroControlePNCP.replace(/[^\w-]/g, '_')}/${hash}.json.gz`,
            gzipSync(registro),
            'application/gzip',
          );
          const [original] = await db
            .insert(documentoOriginal)
            .values({
              fonteId: fontePncp.id,
              url: r.resposta.url,
              idNaFonte: c.numeroControlePNCP,
              // Hash do registro JSON (antes da compressão), para conferir o conteúdo publicado.
              sha256: hash,
              chaveStorage: guardado.chave,
              contentType: 'application/json+gzip',
              tamanhoBytes: guardado.tamanhoBytes,
            })
            .onConflictDoUpdate({
              target: [documentoOriginal.fonteId, documentoOriginal.sha256],
              set: { obtidoEm: sql`now()` },
            })
            .returning({ id: documentoOriginal.id });
          const valores = {
            numeroControlePncpCompra: c.numeroControlePncpCompra ?? null,
            ano: c.anoContrato,
            sequencial: c.sequencialContrato,
            numero: c.numeroContratoEmpenho ?? null,
            processo: c.processo ?? null,
            objeto: c.objetoContrato ?? null,
            orgaoCnpj: apenasDigitos(c.orgaoEntidade.cnpj),
            orgaoNome: c.orgaoEntidade.razaoSocial,
            unidadeNome: c.unidadeOrgao.nomeUnidade ?? null,
            siglaUf: c.unidadeOrgao.ufSigla ?? null,
            codigoIbgeMunicipio: c.unidadeOrgao.codigoIbge ?? null,
            fornecedorTipo: c.tipoPessoa ?? null,
            fornecedorCnpj: cnpj,
            fornecedorNome: c.nomeRazaoSocialFornecedor ?? null,
            fornecedorId: alvos.get(cnpj.slice(0, 8)) ?? null,
            tipoContrato: c.tipoContrato?.nome ?? null,
            categoria: c.categoriaProcesso?.nome ?? null,
            valorInicial: reais(c.valorInicial),
            valorGlobal: reais(c.valorGlobal),
            valorAcumulado: reais(c.valorAcumulado),
            assinadoEm: pncp.diaPncp(c.dataAssinatura),
            vigenciaInicio: pncp.diaPncp(c.dataVigenciaInicio),
            vigenciaFim: pncp.diaPncp(c.dataVigenciaFim),
            emendaParlamentar: c.emendaParlamentar ?? null,
            publicadoEm,
            atualizadoNaFonteEm: pncp.dataPncp(c.dataAtualizacaoGlobal),
            documentoOriginalId: original!.id,
          };
          await db
            .insert(contrato)
            .values({ numeroControlePncp: c.numeroControlePNCP, ...valores })
            .onConflictDoUpdate({
              target: contrato.numeroControlePncp,
              set: { ...valores, atualizadoEm: sql`now()` },
              setWhere: sql`${contrato.atualizadoNaFonteEm} IS NULL
                OR excluded.atualizado_na_fonte_em IS NULL
                OR excluded.atualizado_na_fonte_em >= ${contrato.atualizadoNaFonteEm}`,
            });
          gravados++;
        }
      }
      await pausa();
    }

    await db
      .update(coleta)
      .set({
        situacao: 'concluida',
        concluidaEm: new Date(),
        registrosLidos: lidos,
        registrosGravados: gravados,
      })
      .where(eq(coleta.id, execucao!.id));
    await db
      .insert(checkpoint)
      .values({ chave: 'pncp:contratos:publicacao', fonteId: fontePncp.id, valor: { dia } })
      .onConflictDoUpdate({
        target: checkpoint.chave,
        set: { valor: { dia }, atualizadoEm: sql`now()` },
        setWhere: sql`(${checkpoint.valor}->>'dia') < ${dia}`,
      });
    log.info({ dia, lidos, gravados }, 'contratos do dia');
    return { lidos, gravados };
  } catch (erro) {
    await db
      .update(coleta)
      .set({
        situacao: 'falhou',
        concluidaEm: new Date(),
        registrosLidos: lidos,
        registrosGravados: gravados,
        erro: erro instanceof Error ? erro.message : String(erro),
      })
      .where(eq(coleta.id, execucao!.id));
    throw erro;
  }
}
