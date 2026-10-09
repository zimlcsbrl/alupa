/**
 * Emendas parlamentares impositivas do Estado do Rio de Janeiro, publicadas pela Secretaria de
 * Planejamento no RedePlan (EC estadual nº 97/2023; LCs nº 219/2024 e 221/2024).
 *
 * Três tipos de planilha CSV (";"):
 * - detalhamento: uma linha por emenda (autor, valor, objeto, beneficiário, município, CNPJ);
 * - execução: emenda seguida das notas de empenho, com empenhado, liquidado e pago;
 * - processos: número do processo SEI de cada emenda.
 *
 * A execução de 2024 é publicada por programa de trabalho, sem autor: não serve para ligar
 * pagamentos a deputados e fica de fora.
 */
const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '');
const apenasDigitos = (v: string) => v.replace(/\D/g, '');

export const BASE_URL = 'https://www.redeplan.planejamento.rj.gov.br/img/docs/emendas/';

export type TipoArquivo = 'detalhamento' | 'execucao' | 'processos';

/** Arquivos usados, na ordem de aplicação: dentro do ano, o mais recente vence. */
export const ARQUIVOS: { ano: number; tipo: TipoArquivo; caminho: string }[] = [
  { ano: 2024, tipo: 'detalhamento', caminho: 'base_EmendasImpositivas2024_govrj19122024.csv' },
  { ano: 2025, tipo: 'detalhamento', caminho: 'base_EmendasImpositivas2025_govrj29122025.csv' },
  {
    ano: 2025,
    tipo: 'execucao',
    caminho:
      'relatorio_execucao_orcamentaria_financeira_emendas _impositivas_3_quadri_2025.csv',
  },
  {
    ano: 2026,
    tipo: 'detalhamento',
    caminho: '2026/base_detalhamento_emendas_impositivas_2026_govrj_15012026.csv',
  },
  {
    ano: 2026,
    tipo: 'detalhamento',
    caminho: '2026/base_detalhamento_emendas_impositivas_2026_govrj_09042026_1fase.csv',
  },
  {
    ano: 2026,
    tipo: 'detalhamento',
    caminho: '2026/base_DetalhamentoEmendasImpositivas2026_govrj18082026 - 2fase.csv',
  },
  {
    ano: 2026,
    tipo: 'processos',
    caminho: '2026/ProcessosSEI2026emendas impositivas_govrj18082026.csv',
  },
  {
    ano: 2026,
    tipo: 'execucao',
    caminho:
      '2026/4bi_Relatório de Execução Orçamentária e Financeira das Emendas Impositivas 2026.csv',
  },
];

export const urlArquivo = (caminho: string) => BASE_URL + encodeURI(caminho);

/** As planilhas vêm ora em UTF-8, ora em Windows-1252. */
export function decodificar(bytes: Uint8Array) {
  const utf8 = new TextDecoder('utf-8').decode(bytes);
  const texto = utf8.includes('�') ? new TextDecoder('windows-1252').decode(bytes) : utf8;
  return texto.replace(/^﻿/, '');
}

/** CSV com ";" e aspas, aceitando quebras de linha dentro de campos entre aspas. */
export function lerCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"' && campo.trim() === '') {
      aspas = true;
      campo = '';
    } else if (c === ';') {
      linha.push(campo);
      campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

const limpar = (v: string | undefined) => {
  // Algumas células trazem caracteres de controle (inclusive 0x00), que o Postgres recusa.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: remoção intencional
  const t = (v ?? '').replace(/[\u0000-\u0008\u000B\u000E-\u001F]/g, '').replace(/\s+/g, ' ').trim();
  return t === '' || t === '-' ? null : t;
};

const chaveColuna = (v: string) =>
  semAcentos(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** "R$ 1.234,56", "1.234,56 ", " - " e "(1.234,56)". Traço e vazio valem zero. */
export function lerValor(v: string | undefined): number {
  let t = (v ?? '').replace(/R\$|\s/g, '');
  if (t === '' || t === '-') return 0;
  const negativo = /^\(.*\)$/.test(t) || t.startsWith('-');
  t = t.replace(/[()-]/g, '');
  const n = Number(t.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(n)) throw new Error(`Valor inválido: "${v}"`);
  return negativo ? -n : n;
}

function indicePorColuna(cabecalho: string[], nomes: Record<string, string[]>) {
  const chaves = cabecalho.map(chaveColuna);
  const idx: Record<string, number> = {};
  for (const [campo, opcoes] of Object.entries(nomes)) {
    idx[campo] = chaves.findIndex((k) => opcoes.includes(k));
  }
  return idx;
}

export interface EmendaRj {
  ano: number;
  /** Identificador de 11 dígitos; em 2024, que não o publica, "2024-<número>". */
  codigo: string;
  numero: string | null;
  autor: string;
  valor: number;
  unidadeOrcamentaria: string | null;
  acao: string | null;
  funcao: string | null;
  subfuncao: string | null;
  objeto: string | null;
  justificativa: string | null;
  beneficiario: string | null;
  municipio: string | null;
  cnpjBeneficiario: string | null;
  modalidade: string | null;
}

export function lerDetalhamento(texto: string, ano: number): EmendaRj[] {
  const linhas = lerCsv(texto);
  const iCab = linhas.findIndex((l) => l.some((c) => chaveColuna(c) === 'autor'));
  if (iCab < 0) throw new Error('Cabeçalho do detalhamento não encontrado.');
  const i = indicePorColuna(linhas[iCab]!, {
    numero: ['emenda', 'numero emenda'],
    identificador: ['identificador'],
    autor: ['autor'],
    valor: ['valor'],
    uo: ['uo'],
    acao: ['acao'],
    funcao: ['funcao'],
    subfuncao: ['subfuncao'],
    objeto: ['objeto', 'nome emenda'],
    justificativa: ['justificativa'],
    beneficiario: ['beneficiario'],
    municipio: ['municipio'],
    cnpj: ['cnpj'],
    modalidade: ['modalidade'],
  });
  const col = (l: string[], k: string) => (i[k]! >= 0 ? limpar(l[i[k]!]) : null);

  const emendas: EmendaRj[] = [];
  for (const l of linhas.slice(iCab + 1)) {
    const autor = col(l, 'autor');
    // Números acima de mil vêm com ponto de milhar ("1.069").
    const numero = col(l, 'numero')?.replace(/\./g, '') ?? null;
    if (!autor || !numero || !/^\d+$/.test(numero)) continue;
    const identificador = col(l, 'identificador')?.replace(/\D/g, '') || null;
    const cnpj = apenasDigitos(col(l, 'cnpj') ?? '');
    emendas.push({
      ano,
      codigo: identificador ?? `${ano}-${numero}`,
      numero,
      autor,
      valor: lerValor(l[i.valor!]),
      unidadeOrcamentaria: col(l, 'uo'),
      acao: col(l, 'acao'),
      funcao: col(l, 'funcao'),
      subfuncao: col(l, 'subfuncao'),
      objeto: col(l, 'objeto'),
      justificativa: col(l, 'justificativa'),
      beneficiario: col(l, 'beneficiario'),
      municipio: col(l, 'municipio'),
      cnpjBeneficiario: cnpj.length === 14 ? cnpj : null,
      modalidade: col(l, 'modalidade'),
    });
  }
  return emendas;
}

export interface EmpenhoRj {
  codigoEmenda: string;
  numeroEmpenho: string;
  descricao: string | null;
  empenhado: number;
  liquidado: number;
  pago: number;
}

export interface ExecucaoRj {
  /** Posição do relatório, ex.: "12 / 2025". */
  posicao: string | null;
  /** Dotação por emenda (soma das fontes) e o autor como aparece no relatório. */
  dotacoes: Map<string, { autor: string; dotacao: number }>;
  empenhos: EmpenhoRj[];
}

/**
 * Relatório de execução: cada emenda (com autor e código) vem seguida das notas de empenho,
 * em linhas sem autor nem código. Valores de empenho ficam nas linhas das notas.
 */
export function lerExecucao(texto: string): ExecucaoRj {
  const linhas = lerCsv(texto);
  const iCab = linhas.findIndex((l) => l.some((c) => chaveColuna(c) === 'cod emenda'));
  if (iCab < 0) throw new Error('Cabeçalho da execução não encontrado.');
  const i = indicePorColuna(linhas[iCab]!, {
    posicao: ['posicao'],
    autor: ['autor', 'deputado'],
    codigo: ['cod emenda'],
    empenho: ['n empenho'],
    descricao: ['descricao'],
    dotacao: ['dotacao inicial'],
    empenhado: ['empenhado'],
    liquidado: ['liquidado'],
    pago: ['pago'],
  });

  let posicao: string | null = null;
  let atual: string | null = null;
  const dotacoes = new Map<string, { autor: string; dotacao: number }>();
  const porNota = new Map<string, EmpenhoRj>();
  for (const l of linhas.slice(iCab + 1)) {
    if (l.some((c) => /\btotal\b/i.test(c))) continue;
    posicao ??= limpar(l[i.posicao!]);
    const codigo = limpar(l[i.codigo!])?.replace(/\D/g, '') || null;
    const autor = limpar(l[i.autor!]);
    if (codigo && autor) {
      atual = codigo;
      const d = dotacoes.get(codigo) ?? { autor, dotacao: 0 };
      d.dotacao += lerValor(l[i.dotacao!]);
      dotacoes.set(codigo, d);
    }
    const nota = limpar(l[i.empenho!]);
    if (!atual || !nota) continue;
    // A mesma nota pode aparecer em mais de uma fonte de recurso: soma.
    const chave = `${atual}|${nota}`;
    const e = porNota.get(chave) ?? {
      codigoEmenda: atual,
      numeroEmpenho: nota,
      descricao: limpar(l[i.descricao!]),
      empenhado: 0,
      liquidado: 0,
      pago: 0,
    };
    e.empenhado += lerValor(l[i.empenhado!]);
    e.liquidado += lerValor(l[i.liquidado!]);
    e.pago += lerValor(l[i.pago!]);
    porNota.set(chave, e);
  }
  return { posicao, dotacoes, empenhos: [...porNota.values()] };
}

/** Processos SEI: identificador da emenda → número do processo. */
export function lerProcessos(texto: string): Map<string, string> {
  const linhas = lerCsv(texto);
  const iCab = linhas.findIndex((l) => l.some((c) => chaveColuna(c) === 'n processo'));
  if (iCab < 0) throw new Error('Cabeçalho dos processos não encontrado.');
  const i = indicePorColuna(linhas[iCab]!, {
    identificador: ['identificador'],
    processo: ['n processo'],
  });
  const mapa = new Map<string, string>();
  for (const l of linhas.slice(iCab + 1)) {
    const id = limpar(l[i.identificador!])?.replace(/\D/g, '');
    const processo = limpar(l[i.processo!]);
    if (id && processo) mapa.set(id, processo);
  }
  return mapa;
}
