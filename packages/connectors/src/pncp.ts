import { z } from 'zod';
import { buscar, validarJson, type RespostaBruta } from './http';

/**
 * API de consulta do PNCP: https://pncp.gov.br/api/consulta/swagger-ui/index.html
 * Formato conferido em 06/10/2026 (OpenAPI "API PNCP CONSULTA" 1.0 e respostas reais).
 */
const BASE = 'https://pncp.gov.br/api/consulta';

/** Modalidades de contratação, conforme https://pncp.gov.br/api/pncp/v1/modalidades. */
export const MODALIDADES = {
  1: 'Leilão - Eletrônico',
  2: 'Diálogo Competitivo',
  3: 'Concurso',
  4: 'Concorrência - Eletrônica',
  5: 'Concorrência - Presencial',
  6: 'Pregão - Eletrônico',
  7: 'Pregão - Presencial',
  8: 'Dispensa',
  9: 'Inexigibilidade',
  10: 'Manifestação de Interesse',
  11: 'Pré-qualificação',
  12: 'Credenciamento',
  13: 'Leilão - Presencial',
  14: 'Inaplicabilidade da Licitação',
  15: 'Chamada pública',
  16: 'Concorrência - Eletrônica Internacional',
  17: 'Concorrência - Presencial Internacional',
  18: 'Pregão - Eletrônico Internacional',
  19: 'Pregão - Presencial Internacional',
} as const;

export type CodigoModalidade = keyof typeof MODALIDADES;
export const CODIGOS_MODALIDADE = Object.keys(MODALIDADES).map(Number) as CodigoModalidade[];

/** Tamanho máximo de página aceito pela API. */
export const TAMANHO_PAGINA = 50;

const texto = z.string().nullish();

const orgaoEntidadeSchema = z.object({
  cnpj: z.string(),
  razaoSocial: z.string(),
  /** E, L, J ou N (não se aplica). */
  poderId: texto,
  /** F, E, D, M ou N (não se aplica). */
  esferaId: texto,
});

const unidadeOrgaoSchema = z.object({
  ufSigla: texto,
  ufNome: texto,
  municipioNome: texto,
  codigoIbge: texto,
  codigoUnidade: texto,
  nomeUnidade: texto,
});

export const contratacaoSchema = z.object({
  numeroControlePNCP: z.string(),
  anoCompra: z.number().int(),
  sequencialCompra: z.number().int(),
  numeroCompra: texto,
  processo: texto,
  objetoCompra: texto,
  informacaoComplementar: texto,
  modalidadeId: z.number().int(),
  modalidadeNome: texto,
  modoDisputaId: z.number().int().nullish(),
  modoDisputaNome: texto,
  // A documentação declara texto; as respostas reais trazem número.
  situacaoCompraId: z.coerce.number().int(),
  situacaoCompraNome: texto,
  srp: z.boolean().nullish(),
  valorTotalEstimado: z.number().nullish(),
  valorTotalHomologado: z.number().nullish(),
  dataAberturaProposta: texto,
  dataEncerramentoProposta: texto,
  dataPublicacaoPncp: z.string(),
  dataAtualizacaoGlobal: texto,
  linkSistemaOrigem: texto,
  amparoLegal: z
    .object({ codigo: z.number().int().nullish(), nome: texto, descricao: texto })
    .nullish(),
  orgaoEntidade: orgaoEntidadeSchema,
  unidadeOrgao: unidadeOrgaoSchema,
});

export type ContratacaoPncp = z.infer<typeof contratacaoSchema>;

const paginaSchema = z.object({
  data: z.array(contratacaoSchema),
  totalRegistros: z.number().int(),
  totalPaginas: z.number().int(),
  numeroPagina: z.number().int(),
  paginasRestantes: z.number().int(),
});

export interface PaginaContratacoes {
  resposta: RespostaBruta;
  contratacoes: ContratacaoPncp[];
  totalRegistros: number;
  totalPaginas: number;
}

/** "2026-09-29" → "20260929", formato exigido pela API. */
const formatoData = (dia: string) => dia.replaceAll('-', '');

export function urlContratacoesPublicadas(
  dia: string,
  modalidade: CodigoModalidade,
  pagina: number,
) {
  const params = new URLSearchParams({
    dataInicial: formatoData(dia),
    dataFinal: formatoData(dia),
    codigoModalidadeContratacao: String(modalidade),
    pagina: String(pagina),
    tamanhoPagina: String(TAMANHO_PAGINA),
  });
  return `${BASE}/v1/contratacoes/publicacao?${params}`;
}

/** Uma página de contratações publicadas no PNCP em um dia, para uma modalidade. */
export async function contratacoesPublicadas(
  dia: string,
  modalidade: CodigoModalidade,
  pagina: number,
): Promise<PaginaContratacoes> {
  const resposta = await buscar(urlContratacoesPublicadas(dia, modalidade, pagina));
  // A API responde 204 quando não há registros.
  if (resposta.status === 204 || resposta.texto.trim() === '') {
    return { resposta, contratacoes: [], totalRegistros: 0, totalPaginas: 0 };
  }
  const dados = validarJson(resposta, paginaSchema);
  return {
    resposta,
    contratacoes: dados.data,
    totalRegistros: dados.totalRegistros,
    totalPaginas: dados.totalPaginas,
  };
}

/**
 * Datas do PNCP vêm sem fuso e estão no horário de Brasília (UTC−3, sem horário de verão
 * desde 2019). Datas que já trazem fuso são respeitadas.
 */
export function dataPncp(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const temFuso = /(Z|[+-]\d{2}:?\d{2})$/.test(valor);
  const data = new Date(temFuso ? valor : `${valor}-03:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}
