import { Readable } from 'node:stream';
import { ErroFonte } from './http';

/**
 * Dados abertos do CNPJ da Receita Federal, em compartilhamento público (Nextcloud/WebDAV).
 * Conferido em 07/10/2026: pasta Dados/Cadastros/CNPJ/AAAA-MM/, arquivos Socios0..9.zip etc.
 * CSVs sem cabeçalho, Latin-1, separador ";", campos entre aspas.
 */
const TOKEN = 'gn672Ad4CF8N6TK';
const DAV = `https://arquivos.receitafederal.gov.br/public.php/dav/files/${TOKEN}/Dados/Cadastros/CNPJ`;
const autorizacao = `Basic ${Buffer.from(`${TOKEN}:`).toString('base64')}`;

export const urlArquivo = (mes: string, arquivo: string) => `${DAV}/${mes}/${arquivo}`;
export const URL_PUBLICA = 'https://arquivos.receitafederal.gov.br/index.php/s/gn672Ad4CF8N6TK';
export const PARTES_SOCIOS = Array.from({ length: 10 }, (_, i) => `Socios${i}.zip`);

/** Meses publicados, do mais antigo ao mais recente (ex.: "2026-09"). */
export async function mesesDisponiveis(): Promise<string[]> {
  const r = await fetch(`${DAV}/`, {
    method: 'PROPFIND',
    headers: { Depth: '1', Authorization: autorizacao, 'user-agent': 'A Lupa (https://alupa.app)' },
  });
  if (r.status !== 207) throw new ErroFonte(`PROPFIND HTTP ${r.status}`, DAV, r.status, true);
  const xml = await r.text();
  return [...xml.matchAll(/\/(\d{4}-\d{2})\/<\/d:href>/g)].map((m) => m[1]!).sort();
}

/** Download em fluxo de um arquivo do mês. */
export async function baixarFluxo(mes: string, arquivo: string) {
  const url = urlArquivo(mes, arquivo);
  const r = await fetch(url, {
    headers: { Authorization: autorizacao, 'user-agent': 'A Lupa (https://alupa.app)' },
    signal: AbortSignal.timeout(60 * 60 * 1000),
  });
  if (!r.ok || !r.body) throw new ErroFonte(`HTTP ${r.status}`, url, r.status, r.status < 500);
  return { url, fluxo: Readable.fromWeb(r.body as never) as AsyncIterable<Uint8Array> };
}

/** Linha do arquivo de sócios (11 colunas, leiaute da Receita). */
export interface LinhaSocio {
  cnpjBasico: string;
  /** 1 = pessoa jurídica, 2 = pessoa física, 3 = estrangeiro. */
  identificador: number;
  nome: string;
  /** PF: "***456789**". PJ: CNPJ. */
  documento: string;
  qualificacao: number;
  /** AAAAMMDD. */
  entrada: string;
  faixaEtaria: number;
}

/**
 * Separa os campos de uma linha da Receita. Todos os campos vêm entre aspas e alguns contêm ";"
 * (razões sociais, complementos de endereço): separar só por ";" desalinha as colunas.
 */
export function camposReceita(linha: string): string[] {
  const t = linha.trim();
  if (t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1).split('";"');
  return t.split(';');
}

/** Interpreta uma linha do CSV de sócios; null se não tiver o leiaute esperado. */
export function lerLinhaSocio(linha: string): LinhaSocio | null {
  const c = camposReceita(linha);
  if (c.length < 11 || !/^\d{8}$/.test(c[0]!)) return null;
  return {
    cnpjBasico: c[0]!,
    identificador: Number(c[1]),
    nome: c[2]!,
    documento: c[3]!,
    qualificacao: Number(c[4]),
    entrada: c[5]!,
    faixaEtaria: Number(c[10]),
  };
}

/** "20190315" → "2019-03-15"; null para datas vazias ou inválidas. */
export function dataReceita(v: string): string | null {
  if (!/^\d{8}$/.test(v) || v === '00000000') return null;
  return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
}

export const PARTES_EMPRESAS = Array.from({ length: 10 }, (_, i) => `Empresas${i}.zip`);
export const PARTES_ESTABELECIMENTOS = Array.from(
  { length: 10 },
  (_, i) => `Estabelecimentos${i}.zip`,
);

/** "1234,56" → "1234.56". */
const decimal = (v: string) => {
  const n = v.replace(/\./g, '').replace(',', '.');
  return /^\d+(\.\d+)?$/.test(n) ? Number(n).toFixed(2) : null;
};

export interface LinhaEmpresa {
  cnpjBasico: string;
  razaoSocial: string;
  naturezaJuridica: number;
  capitalSocial: string | null;
  /** 00 não informado, 01 microempresa, 03 pequeno porte, 05 demais. */
  porte: string;
}

/** Tabela Empresas: 7 colunas. */
export function lerLinhaEmpresa(linha: string): LinhaEmpresa | null {
  const c = camposReceita(linha);
  if (c.length !== 7 || !/^\d{8}$/.test(c[0]!)) return null;
  return {
    cnpjBasico: c[0]!,
    razaoSocial: c[1]!.trim(),
    naturezaJuridica: Number(c[2]),
    capitalSocial: decimal(c[4]!),
    porte: c[5]!,
  };
}

export interface LinhaEstabelecimento {
  cnpj: string;
  cnpjBasico: string;
  matriz: boolean;
  nomeFantasia: string | null;
  /** 01 nula, 02 ativa, 03 suspensa, 04 inapta, 08 baixada. */
  situacaoCadastral: string;
  dataSituacao: string | null;
  inicioAtividade: string | null;
  cnaePrincipal: string;
  tipoLogradouro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  /** Código de município da Receita (tabela Municipios), não o do IBGE. */
  municipioReceita: string;
}

/** Tabela Estabelecimentos: 30 colunas. Telefones e e-mails não são lidos. */
export function lerLinhaEstabelecimento(linha: string): LinhaEstabelecimento | null {
  const c = camposReceita(linha);
  if (c.length !== 30 || !/^\d{8}$/.test(c[0]!)) return null;
  const vazio = (v: string) => v.trim() || null;
  return {
    cnpj: `${c[0]}${c[1]}${c[2]}`,
    cnpjBasico: c[0]!,
    matriz: c[3] === '1',
    nomeFantasia: vazio(c[4]!),
    situacaoCadastral: c[5]!,
    dataSituacao: dataReceita(c[6]!),
    inicioAtividade: dataReceita(c[10]!),
    cnaePrincipal: c[11]!,
    tipoLogradouro: c[13]!.trim(),
    logradouro: c[14]!.trim(),
    numero: c[15]!.trim(),
    complemento: c[16]!.trim(),
    bairro: c[17]!.trim(),
    cep: c[18]!.trim(),
    uf: c[19]!.trim(),
    municipioReceita: c[20]!.trim(),
  };
}

export const SITUACOES_CADASTRAIS: Record<string, string> = {
  '01': 'Nula',
  '1': 'Nula',
  '02': 'Ativa',
  '2': 'Ativa',
  '03': 'Suspensa',
  '3': 'Suspensa',
  '04': 'Inapta',
  '4': 'Inapta',
  '08': 'Baixada',
  '8': 'Baixada',
};

export const PORTES: Record<string, string> = {
  '00': 'Não informado',
  '01': 'Microempresa',
  '03': 'Empresa de pequeno porte',
  '05': 'Demais',
};

/** Natureza jurídica 213-5: empresário individual (inclui MEI). Endereço tende a ser residencial. */
export const NATUREZA_EMPRESARIO_INDIVIDUAL = 2135;
