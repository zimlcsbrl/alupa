import { baixar, emendasRj } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import type { Armazenamento } from '@alupa/storage';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Logger } from 'pino';
import { carregarVinculosManuais, normalizar } from '../alerj';

const {
  candidatura,
  documentoOriginal,
  emenda,
  emendaEmpenho,
  enteFederativo,
  fonte,
  mandato,
  organizacao,
  pessoa,
} = schema;

const reais = (v: number) => v.toFixed(2);

/**
 * Liga o nome parlamentar do autor a uma pessoa: primeiro os vínculos manuais revisados;
 * depois o nome de urna (ou o nome civil) entre candidatos a deputado estadual no RJ em 2022,
 * preferindo quem teve mandato na ALERJ. Nome ambíguo fica sem ligação, para revisão.
 */
async function indiceDeAutores(db: Database, log: Logger) {
  const candidatos = await db
    .select({
      pessoaId: candidatura.pessoaId,
      nomeUrna: candidatura.nomeUrna,
      nome: pessoa.nome,
      comMandato: sql<boolean>`EXISTS (SELECT 1 FROM core.mandato m WHERE m.pessoa_id = ${pessoa.id}
        AND m.cargo = 'deputado_estadual')`,
    })
    .from(candidatura)
    .innerJoin(pessoa, eq(pessoa.id, candidatura.pessoaId))
    .where(
      and(eq(candidatura.ano, 2022), eq(candidatura.codigoCargo, 7), eq(candidatura.siglaUf, 'RJ')),
    );
  // Deputados da ALERJ que não puderam ser ligados ao TSE também entram, pelo nome da Casa.
  const daAlerj = await db
    .select({ pessoaId: mandato.pessoaId, nome: pessoa.nome })
    .from(mandato)
    .innerJoin(pessoa, eq(pessoa.id, mandato.pessoaId))
    .where(eq(mandato.cargo, 'deputado_estadual'));

  const indice = new Map<string, Map<string, boolean>>();
  const add = (nome: string | null, id: string, comMandato: boolean) => {
    if (!nome) return;
    const k = normalizar(nome);
    const m = indice.get(k) ?? new Map<string, boolean>();
    m.set(id, (m.get(id) ?? false) || comMandato);
    indice.set(k, m);
  };
  for (const c of candidatos) {
    add(c.nomeUrna, c.pessoaId, c.comMandato);
    add(c.nome, c.pessoaId, c.comMandato);
  }
  for (const d of daAlerj) add(d.nome, d.pessoaId, true);

  const manuais = await carregarVinculosManuais(db, 'emendas-rj', log);
  return (autor: string): string | null => {
    const manual = manuais.get(autor);
    if (manual) return manual;
    const achados = indice.get(normalizar(autor));
    if (!achados) return null;
    if (achados.size === 1) return [...achados.keys()][0]!;
    const comMandato = [...achados].filter(([, m]) => m).map(([id]) => id);
    return comMandato.length === 1 ? comMandato[0]! : null;
  };
}

/**
 * Importa as emendas impositivas estaduais do RJ: detalhamento, processos SEI e execução.
 * Guarda cada planilha original; a execução substitui as notas de empenho de cada emenda.
 */
export async function importarEmendasRj(db: Database, armazenamento: Armazenamento, log: Logger) {
  const [fonteEmendas] = await db
    .select({ id: fonte.id })
    .from(fonte)
    .where(eq(fonte.codigo, 'emendas-rj'));
  if (!fonteEmendas) throw new Error('Fonte "emendas-rj" não cadastrada. Rode pnpm db:seed.');
  const [rj] = await db
    .select({ id: enteFederativo.id })
    .from(enteFederativo)
    .where(eq(enteFederativo.codigoIbge, '33'));
  if (!rj) throw new Error('UF RJ não carregada. Rode pnpm db:seed.');

  const autorPara = await indiceDeAutores(db, log);
  const semLigacao = new Set<string>();
  const resumo: Record<string, number> = { emendas: 0, ligadas: 0, empenhos: 0 };

  for (const arquivo of emendasRj.ARQUIVOS) {
    const url = emendasRj.urlArquivo(arquivo.caminho);
    const baixado = await baixar(url);
    const guardado = await armazenamento.guardar(
      `emendas-rj/${arquivo.ano}/${arquivo.caminho.split('/').pop()}`,
      baixado.bytes,
      'text/csv',
    );
    const [doc] = await db
      .insert(documentoOriginal)
      .values({
        fonteId: fonteEmendas.id,
        url,
        idNaFonte: arquivo.caminho,
        sha256: guardado.sha256,
        chaveStorage: guardado.chave,
        contentType: 'text/csv',
        tamanhoBytes: guardado.tamanhoBytes,
      })
      .onConflictDoUpdate({
        target: [documentoOriginal.fonteId, documentoOriginal.sha256],
        set: { obtidoEm: sql`now()` },
      })
      .returning({ id: documentoOriginal.id });
    const texto = emendasRj.decodificar(baixado.bytes);

    if (arquivo.tipo === 'detalhamento') {
      const emendas = emendasRj.lerDetalhamento(texto, arquivo.ano);
      const cnpjs = [...new Set(emendas.map((e) => e.cnpjBeneficiario).filter(Boolean))];
      const conhecidas = new Set(
        cnpjs.length
          ? (
              await db
                .select({ cnpj: organizacao.cnpj })
                .from(organizacao)
                .where(inArray(organizacao.cnpj, cnpjs as string[]))
            ).map((o) => o.cnpj)
          : [],
      );
      for (let i = 0; i < emendas.length; i += 200) {
        const lote = emendas.slice(i, i + 200).map((e) => {
          const pessoaId = autorPara(e.autor);
          if (!pessoaId) semLigacao.add(e.autor);
          return {
            enteId: rj.id,
            ano: e.ano,
            codigo: e.codigo,
            numero: e.numero,
            tipo: 'impositiva_estadual',
            autorNome: e.autor,
            pessoaId,
            valor: reais(e.valor),
            unidadeOrcamentaria: e.unidadeOrcamentaria,
            acao: e.acao,
            funcao: e.funcao,
            subfuncao: e.subfuncao,
            objeto: e.objeto,
            justificativa: e.justificativa,
            beneficiario: e.beneficiario,
            municipio: e.municipio,
            beneficiarioCnpj: e.cnpjBeneficiario,
            modalidade: e.modalidade,
            fonteUrl: url,
            documentoOriginalId: doc!.id,
          };
        });
        await db
          .insert(emenda)
          .values(lote)
          .onConflictDoUpdate({
            target: [emenda.enteId, emenda.ano, emenda.codigo],
            set: {
              autorNome: sql`excluded.autor_nome`,
              pessoaId: sql`excluded.pessoa_id`,
              valor: sql`excluded.valor`,
              unidadeOrcamentaria: sql`excluded.unidade_orcamentaria`,
              acao: sql`excluded.acao`,
              funcao: sql`excluded.funcao`,
              subfuncao: sql`excluded.subfuncao`,
              objeto: sql`excluded.objeto`,
              justificativa: sql`excluded.justificativa`,
              beneficiario: sql`excluded.beneficiario`,
              municipio: sql`excluded.municipio`,
              beneficiarioCnpj: sql`excluded.beneficiario_cnpj`,
              modalidade: sql`excluded.modalidade`,
              fonteUrl: sql`excluded.fonte_url`,
              documentoOriginalId: sql`excluded.documento_original_id`,
              atualizadoEm: sql`now()`,
            },
          });
      }
      resumo.emendas = (resumo.emendas ?? 0) + emendas.length;
      log.info(
        { arquivo: arquivo.caminho, emendas: emendas.length, beneficiariosConhecidos: conhecidas.size },
        'detalhamento importado',
      );
    } else if (arquivo.tipo === 'processos') {
      const processos = emendasRj.lerProcessos(texto);
      for (const [codigo, processo] of processos) {
        await db
          .update(emenda)
          .set({ processoSei: processo, atualizadoEm: sql`now()` })
          .where(and(eq(emenda.enteId, rj.id), eq(emenda.ano, arquivo.ano), eq(emenda.codigo, codigo)));
      }
      log.info({ arquivo: arquivo.caminho, processos: processos.size }, 'processos SEI');
    } else {
      const execucao = emendasRj.lerExecucao(texto);
      const ids = new Map(
        (
          await db
            .select({ id: emenda.id, codigo: emenda.codigo })
            .from(emenda)
            .where(and(eq(emenda.enteId, rj.id), eq(emenda.ano, arquivo.ano)))
        ).map((e) => [e.codigo, e.id]),
      );
      const porEmenda = new Map<string, typeof execucao.empenhos>();
      for (const e of execucao.empenhos) {
        porEmenda.set(e.codigoEmenda, [...(porEmenda.get(e.codigoEmenda) ?? []), e]);
      }
      let semDetalhamento = 0;
      await db.transaction(async (tx) => {
        for (const codigo of execucao.dotacoes.keys()) {
          const emendaId = ids.get(codigo);
          if (!emendaId) {
            semDetalhamento++;
            continue;
          }
          const notas = porEmenda.get(codigo) ?? [];
          // O relatório é acumulado: as notas desta posição substituem as anteriores.
          await tx.delete(emendaEmpenho).where(eq(emendaEmpenho.emendaId, emendaId));
          if (notas.length) {
            await tx.insert(emendaEmpenho).values(
              notas.map((n) => ({
                emendaId,
                numeroEmpenho: n.numeroEmpenho,
                descricao: n.descricao,
                empenhado: reais(n.empenhado),
                liquidado: reais(n.liquidado),
                pago: reais(n.pago),
                posicao: execucao.posicao,
                documentoOriginalId: doc!.id,
              })),
            );
          }
          const soma = (k: 'empenhado' | 'liquidado' | 'pago') =>
            reais(notas.reduce((s, n) => s + n[k], 0));
          await tx
            .update(emenda)
            .set({
              empenhado: soma('empenhado'),
              liquidado: soma('liquidado'),
              pago: soma('pago'),
              posicaoExecucao: execucao.posicao,
              atualizadoEm: sql`now()`,
            })
            .where(eq(emenda.id, emendaId));
          resumo.empenhos = (resumo.empenhos ?? 0) + notas.length;
        }
      });
      log.info(
        { arquivo: arquivo.caminho, posicao: execucao.posicao, semDetalhamento },
        'execução importada',
      );
    }
  }

  const [ligadas] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(emenda)
    .where(and(eq(emenda.enteId, rj.id), sql`${emenda.pessoaId} IS NOT NULL`));
  resumo.ligadas = ligadas?.n ?? 0;
  if (semLigacao.size) {
    log.warn({ autores: [...semLigacao].sort() }, 'autores sem ligação automática: revisar');
  }
  return { ...resumo, autoresSemLigacao: semLigacao.size };
}
