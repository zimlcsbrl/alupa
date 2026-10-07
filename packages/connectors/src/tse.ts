/**
 * Dados abertos do TSE: https://dadosabertos.tse.jus.br
 * Arquivos por ano, com um CSV por UF (Latin-1, separador ";", campos entre aspas).
 * Conferido em 06/10/2026 para 2022, 2024 e 2026.
 */
const CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

export const urlCandidatos = (ano: number) => `${CDN}/consulta_cand/consulta_cand_${ano}.zip`;
export const urlBens = (ano: number) => `${CDN}/bem_candidato/bem_candidato_${ano}.zip`;

/** Página de divulgação de candidaturas do TSE, para o leitor conferir. */
export const URL_DIVULGACAND = 'https://divulgacandcontas.tse.jus.br/divulga/';

/** Códigos de cargo usados nos arquivos do TSE. */
export const CARGOS = {
  1: 'Presidente',
  2: 'Vice-presidente',
  3: 'Governador',
  4: 'Vice-governador',
  5: 'Senador',
  6: 'Deputado federal',
  7: 'Deputado estadual',
  8: 'Deputado distrital',
  9: '1º suplente de senador',
  10: '2º suplente de senador',
  11: 'Prefeito',
  12: 'Vice-prefeito',
  13: 'Vereador',
} as const;

/** "#NULO", "#NE" e vazios viram null. */
export function valorTse(v: string | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t === '' || t.startsWith('#NULO') || t === '#NE' || t === '-1' || t === '-3' ? null : t;
}

/** "1.234,56" ou "1234,56" → "1234.56" (texto, para numeric sem perda). */
export function reaisTse(v: string | undefined): string | null {
  const t = valorTse(v);
  if (!t) return null;
  const normalizado = t.replace(/\./g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado).toFixed(2) : null;
}

/** Nome do CSV de uma UF dentro do ZIP, ex.: "consulta_cand_2026_RJ.csv". */
export const ehCsvDeUf = (nome: string, prefixo: string) =>
  new RegExp(`^${prefixo}_[A-Z]{2}\\.csv$`, 'i').test(nome.split('/').pop() ?? '');
