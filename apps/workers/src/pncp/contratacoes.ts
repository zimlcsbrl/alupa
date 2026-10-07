import { pncp } from '@alupa/connectors';
import type { Database } from '@alupa/db';
import { schema } from '@alupa/db';
import { apenasDigitos, slugify } from '@alupa/domain';
import type { Armazenamento } from '@alupa/storage';
import { eq, sql } from 'drizzle-orm';
import type { Logger } from 'pino';

const {
  contratacao,
  coleta,
  checkpoint,
  documentoOriginal,
  enteFederativo,
  fonte,
  orgao,
  organizacao,
} = schema;

type Poder = (typeof schema.poder.enumValues)[number];

/** Códigos de poder do PNCP. "N" (não se aplica) e desconhecidos viram "outro". */
const PODERES: Record<string, Poder> = { E: 'executivo', L: 'legislativo', J: 'judiciario' };

/** Intervalo entre requisições, para não sobrecarregar a API pública. */
const PAUSA_MS = 150;
const pausa = () => new Promise((r) => setTimeout(r, PAUSA_MS));

interface Referencias {
  fonteId: string;
  uniaoId: string;
  ufPorSigla: Map<string, string>;
  municipioPorIbge: Map<string, string>;
}

export async function carregarReferencias(db: Database): Promise<Referencias> {
  const [fontePncp] = await db.select({ id: fonte.id }).from(fonte).where(eq(fonte.codigo, 'pncp'));
  if (!fontePncp) throw new Error('Fonte "pncp" não cadastrada. Rode pnpm db:seed.');

  const entes = await db
    .select({
      id: enteFederativo.id,
      esfera: enteFederativo.esfera,
      codigoIbge: enteFederativo.codigoIbge,
      siglaUf: enteFederativo.siglaUf,
    })
    .from(enteFederativo);

  const uniao = entes.find((e) => e.esfera === 'federal');
  if (!uniao) throw new Error('Localidades não carregadas. Rode pnpm db:seed.');

  return {
    fonteId: fontePncp.id,
    uniaoId: uniao.id,
    ufPorSigla: new Map(
      entes.filter((e) => e.codigoIbge?.length === 2).map((e) => [e.siglaUf!, e.id]),
    ),
    municipioPorIbge: new Map(
      entes.filter((e) => e.codigoIbge?.length === 7).map((e) => [e.codigoIbge!, e.id]),
    ),
  };
}

/** Ente responsável conforme a esfera informada pelo PNCP e a localização da unidade. */
export function resolverEnte(c: pncp.ContratacaoPncp, ref: Referencias): string {
  const uf = c.unidadeOrgao.ufSigla ? ref.ufPorSigla.get(c.unidadeOrgao.ufSigla) : undefined;
  const municipio = c.unidadeOrgao.codigoIbge
    ? ref.municipioPorIbge.get(c.unidadeOrgao.codigoIbge)
    : undefined;

  switch (c.orgaoEntidade.esferaId) {
    case 'F':
      return ref.uniaoId;
    case 'E':
      return uf ?? ref.uniaoId;
    case 'D':
      return ref.ufPorSigla.get('DF') ?? ref.uniaoId;
    case 'M':
      return municipio ?? uf ?? ref.uniaoId;
    default:
      return municipio ?? uf ?? ref.uniaoId;
  }
}

const reais = (v: number | null | undefined) => (v == null ? null : v.toFixed(2));

interface ResultadoPagina {
  lidos: number;
  gravados: number;
}

/** Guarda o original e grava a página em uma transação. */
async function processarPagina(
  db: Database,
  armazenamento: Armazenamento,
  ref: Referencias,
  dia: string,
  modalidade: pncp.CodigoModalidade,
  numeroPagina: number,
  pagina: pncp.PaginaContratacoes,
): Promise<ResultadoPagina> {
  const chave = `pncp/contratacoes/publicacao/${dia}/m${modalidade}/p${numeroPagina}.json`;
  const guardado = await armazenamento.guardar(
    chave,
    pagina.resposta.texto,
    pagina.resposta.contentType,
  );

  return db.transaction(async (tx) => {
    const [original] = await tx
      .insert(documentoOriginal)
      .values({
        fonteId: ref.fonteId,
        url: pagina.resposta.url,
        idNaFonte: `contratacoes/publicacao/${dia}/m${modalidade}/p${numeroPagina}`,
        sha256: guardado.sha256,
        chaveStorage: guardado.chave,
        contentType: guardado.contentType,
        tamanhoBytes: guardado.tamanhoBytes,
      })
      // Mesmo conteúdo já guardado: reaproveita o registro existente.
      .onConflictDoUpdate({
        target: [documentoOriginal.fonteId, documentoOriginal.sha256],
        set: { obtidoEm: sql`now()` },
      })
      .returning({ id: documentoOriginal.id });

    // Organizações (CNPJ) e órgãos, sem repetir dentro da página.
    const porCnpj = new Map<string, pncp.ContratacaoPncp>();
    for (const c of pagina.contratacoes) {
      const cnpj = apenasDigitos(c.orgaoEntidade.cnpj);
      if (cnpj.length === 14 && !porCnpj.has(cnpj)) porCnpj.set(cnpj, c);
    }
    if (porCnpj.size === 0) return { lidos: pagina.contratacoes.length, gravados: 0 };

    const organizacoes = await tx
      .insert(organizacao)
      .values(
        [...porCnpj].map(([cnpj, c]) => ({
          cnpj,
          razaoSocial: c.orgaoEntidade.razaoSocial,
          slug: `${slugify(c.orgaoEntidade.razaoSocial)}-${cnpj}`,
        })),
      )
      .onConflictDoUpdate({
        target: organizacao.cnpj,
        set: { razaoSocial: sql`excluded.razao_social`, atualizadoEm: sql`now()` },
      })
      .returning({ id: organizacao.id, cnpj: organizacao.cnpj });

    const orgaos = await tx
      .insert(orgao)
      .values(
        organizacoes.map((o) => {
          const c = porCnpj.get(o.cnpj!)!;
          return {
            organizacaoId: o.id,
            enteId: resolverEnte(c, ref),
            poder: PODERES[c.orgaoEntidade.poderId ?? ''] ?? ('outro' as const),
            nome: c.orgaoEntidade.razaoSocial,
            slug: `${slugify(c.orgaoEntidade.razaoSocial)}-${o.cnpj}`,
          };
        }),
      )
      .onConflictDoUpdate({
        target: orgao.organizacaoId,
        set: { nome: sql`excluded.nome`, atualizadoEm: sql`now()` },
      })
      .returning({ id: orgao.id, organizacaoId: orgao.organizacaoId });

    const orgaoPorCnpj = new Map(
      orgaos.map((g) => [organizacoes.find((o) => o.id === g.organizacaoId)!.cnpj!, g.id]),
    );

    const linhas = pagina.contratacoes.flatMap((c) => {
      const orgaoId = orgaoPorCnpj.get(apenasDigitos(c.orgaoEntidade.cnpj));
      const publicadaEm = pncp.dataPncp(c.dataPublicacaoPncp);
      if (!orgaoId || !publicadaEm) return [];
      return [
        {
          numeroControlePncp: c.numeroControlePNCP,
          orgaoId,
          enteId: resolverEnte(c, ref),
          unidadeCodigo: c.unidadeOrgao.codigoUnidade ?? null,
          unidadeNome: c.unidadeOrgao.nomeUnidade ?? null,
          ano: c.anoCompra,
          sequencial: c.sequencialCompra,
          numero: c.numeroCompra ?? null,
          processo: c.processo ?? null,
          objeto: c.objetoCompra ?? null,
          informacaoComplementar: c.informacaoComplementar ?? null,
          modalidadeId: c.modalidadeId,
          modalidadeNome: c.modalidadeNome ?? null,
          modoDisputaId: c.modoDisputaId ?? null,
          modoDisputaNome: c.modoDisputaNome ?? null,
          amparoLegalCodigo: c.amparoLegal?.codigo ?? null,
          amparoLegalNome: c.amparoLegal?.nome ?? null,
          situacaoId: c.situacaoCompraId,
          situacaoNome: c.situacaoCompraNome ?? null,
          registroDePrecos: c.srp ?? null,
          valorEstimado: reais(c.valorTotalEstimado),
          valorHomologado: reais(c.valorTotalHomologado),
          aberturaPropostasEm: pncp.dataPncp(c.dataAberturaProposta),
          encerramentoPropostasEm: pncp.dataPncp(c.dataEncerramentoProposta),
          publicadaEm,
          atualizadaNaFonteEm: pncp.dataPncp(c.dataAtualizacaoGlobal),
          linkSistemaOrigem: c.linkSistemaOrigem ?? null,
          documentoOriginalId: original!.id,
        },
      ];
    });

    // Repetições do mesmo registro na página: fica a última ocorrência.
    const unicas = [...new Map(linhas.map((l) => [l.numeroControlePncp, l])).values()];
    if (unicas.length === 0) return { lidos: pagina.contratacoes.length, gravados: 0 };

    const colunas = [
      'enteId',
      'unidadeCodigo',
      'unidadeNome',
      'numero',
      'processo',
      'objeto',
      'informacaoComplementar',
      'modalidadeId',
      'modalidadeNome',
      'modoDisputaId',
      'modoDisputaNome',
      'amparoLegalCodigo',
      'amparoLegalNome',
      'situacaoId',
      'situacaoNome',
      'registroDePrecos',
      'valorEstimado',
      'valorHomologado',
      'aberturaPropostasEm',
      'encerramentoPropostasEm',
      'publicadaEm',
      'atualizadaNaFonteEm',
      'linkSistemaOrigem',
      'documentoOriginalId',
      'orgaoId',
    ] as const;
    // Com casing snake_case, o nome da coluna no banco é o da propriedade em snake_case.
    const set = Object.fromEntries(
      colunas.map((c) => [
        c,
        sql.raw(`excluded.${c.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`)}`),
      ]),
    );

    const gravadas = await tx
      .insert(contratacao)
      .values(unicas)
      .onConflictDoUpdate({
        target: contratacao.numeroControlePncp,
        set: { ...set, atualizadoEm: sql`now()` },
        // Só substitui quando a fonte traz uma versão igual ou mais nova.
        setWhere: sql`${contratacao.atualizadaNaFonteEm} IS NULL
          OR excluded.atualizada_na_fonte_em IS NULL
          OR excluded.atualizada_na_fonte_em >= ${contratacao.atualizadaNaFonteEm}`,
      })
      .returning({ id: contratacao.id });

    return { lidos: pagina.contratacoes.length, gravados: gravadas.length };
  });
}

/** Coleta todas as páginas de um dia para uma modalidade. Idempotente. */
export async function coletarDia(
  db: Database,
  armazenamento: Armazenamento,
  ref: Referencias,
  dia: string,
  modalidade: pncp.CodigoModalidade,
  log: Logger,
) {
  const [execucao] = await db
    .insert(coleta)
    .values({
      fonteId: ref.fonteId,
      tarefa: 'pncp:contratacoes:publicacao',
      situacao: 'em_execucao',
      parametros: { dia, modalidade },
      iniciadaEm: new Date(),
    })
    .returning({ id: coleta.id });

  let lidos = 0;
  let gravados = 0;
  try {
    let numeroPagina = 1;
    let totalPaginas = 1;
    while (numeroPagina <= totalPaginas) {
      const pagina = await pncp.contratacoesPublicadas(dia, modalidade, numeroPagina);
      totalPaginas = pagina.totalPaginas;
      if (pagina.contratacoes.length > 0) {
        const r = await processarPagina(
          db,
          armazenamento,
          ref,
          dia,
          modalidade,
          numeroPagina,
          pagina,
        );
        lidos += r.lidos;
        gravados += r.gravados;
      }
      log.debug({ dia, modalidade, numeroPagina, totalPaginas }, 'página processada');
      numeroPagina++;
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

    // O checkpoint só avança: guarda o dia mais recente concluído por modalidade.
    await db
      .insert(checkpoint)
      .values({
        chave: `pncp:contratacoes:publicacao:m${modalidade}`,
        fonteId: ref.fonteId,
        valor: { dia },
      })
      .onConflictDoUpdate({
        target: checkpoint.chave,
        set: { valor: { dia }, atualizadoEm: sql`now()` },
        setWhere: sql`(${checkpoint.valor}->>'dia') < ${dia}`,
      });

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
