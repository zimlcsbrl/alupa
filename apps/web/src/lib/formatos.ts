const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' });
const dataCurta = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

/** Valor numeric do banco (texto) em reais; null vira "não informado". */
export function emReais(valor: string | number | null | undefined) {
  if (valor == null) return 'Não informado';
  return reais.format(Number(valor));
}

/**
 * Valor estimado de uma contratação. O PNCP registra 0 quando o órgão não divulga a estimativa,
 * o que a Lei 14.133/2021 (art. 24) permite ao manter o orçamento sigiloso.
 */
export function valorEstimado(valor: string | number | null | undefined) {
  if (valor != null && Number(valor) === 0) return 'Não divulgado';
  return emReais(valor);
}

export const estimativaNaoDivulgada = (valor: string | number | null | undefined) =>
  valor != null && Number(valor) === 0;

export const formatarData = (d: Date | string | null | undefined) =>
  d ? data.format(typeof d === 'string' ? new Date(`${d}T12:00:00-03:00`) : d) : '—';
export const formatarDataCurta = (d: Date | null | undefined) => (d ? dataCurta.format(d) : '—');
export const formatarDataHora = (d: Date | null | undefined) => (d ? dataHora.format(d) : '—');

export function formatarCnpj(cnpj: string | null | undefined) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '—';
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export const numero = (n: number) => n.toLocaleString('pt-BR');

export const PODERES: Record<string, string> = {
  executivo: 'Executivo',
  legislativo: 'Legislativo',
  judiciario: 'Judiciário',
  ministerio_publico: 'Ministério Público',
  defensoria: 'Defensoria Pública',
  tribunal_de_contas: 'Tribunal de Contas',
  outro: 'Não informado pela fonte',
};

export const CARGOS: Record<string, string> = {
  deputado_federal: 'Deputado(a) federal',
  deputado_estadual: 'Deputado(a) estadual',
  senador: 'Senador(a)',
};

/** "DEPUTADO ESTADUAL" (TSE) → "Deputado estadual". */
export const cargoTse = (cargo: string) => cargo.charAt(0) + cargo.slice(1).toLowerCase();

/** "ELEITO POR QP" → "Eleito por QP"; mantém siglas do TSE. */
export const resultadoTse = (r: string | null) =>
  r
    ? r.charAt(0) +
      r
        .slice(1)
        .toLowerCase()
        .replace(/\bqp\b/, 'QP')
    : 'Resultado não informado';

const reaisInteiros = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
export const emReaisInteiros = (v: number) => reaisInteiros.format(v);

/** Página, limitada para evitar varredura completa por paginação (ver plano, Parte 6). */
export function lerPagina(valor: string | string[] | undefined, maximo = 20) {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(n) && n >= 1 ? Math.min(n, maximo) : 1;
}

export const lerTexto = (valor: string | string[] | undefined, limite = 80) =>
  (Array.isArray(valor) ? valor[0] : valor)?.trim().slice(0, limite) ?? '';
