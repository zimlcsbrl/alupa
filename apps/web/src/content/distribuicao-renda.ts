import type { LimitePercentil } from '@alupa/domain';

// Limites superiores das classes de percentual, Brasil, PNAD Contínua anual, valores nominais
// "a preços médios do ano". Conferidos na API de agregados do IBGE em 6 de outubro de 2026.
// Ao atualizar, troque o ano e todos os limites juntos: nunca misture anos.

export type TipoDeRenda = 'domiciliar' | 'individual';

export interface DistribuicaoDeRenda {
  tipo: TipoDeRenda;
  ano: number;
  /** Quem entra na comparação, nas palavras do IBGE. */
  universo: string;
  /** O que exatamente é comparado. */
  conceito: string;
  fonte: { nome: string; tabela: number; url: string };
  limites: LimitePercentil[];
  /** Estimativas da PNAD em pessoas (a API publica em mil pessoas), mesmo ano dos limites. */
  populacao: {
    total: number;
    porInicioDaFaixa: Record<number, number>;
    tabela: number;
    url: string;
  };
}

const sidra = (tabela: number) => `https://sidra.ibge.gov.br/tabela/${tabela}`;

export const distribuicoesDeRenda: Record<TipoDeRenda, DistribuicaoDeRenda> = {
  domiciliar: {
    tipo: 'domiciliar',
    ano: 2025,
    universo: 'Toda a população residente.',
    conceito:
      'Rendimento domiciliar per capita: soma dos rendimentos de todas as fontes dos moradores, dividida pelo número de moradores.',
    fonte: { nome: 'IBGE · PNAD Contínua 2025 · Tabela 7438', tabela: 7438, url: sidra(7438) },
    populacao: {
      total: 212624000,
      tabela: 7521,
      url: sidra(7521),
      porInicioDaFaixa: {
        0: 10789000,
        5: 10513000,
        10: 21227000,
        20: 21276000,
        30: 21223000,
        40: 21397000,
        50: 21139000,
        60: 21271000,
        70: 21242000,
        80: 21280000,
        90: 10634000,
        95: 8503000,
        99: 2128000,
      },
    },
    limites: [
      { percentual: 5, limite: 299 },
      { percentual: 10, limite: 451 },
      { percentual: 20, limite: 694 },
      { percentual: 30, limite: 906 },
      { percentual: 40, limite: 1154 },
      { percentual: 50, limite: 1490 },
      { percentual: 60, limite: 1697 },
      { percentual: 70, limite: 2158 },
      { percentual: 80, limite: 2958 },
      { percentual: 90, limite: 4609 },
      { percentual: 95, limite: 6900 },
      { percentual: 99, limite: 15214 },
    ],
  },
  individual: {
    tipo: 'individual',
    ano: 2025,
    universo:
      'Pessoas de 14 anos ou mais ocupadas na semana de referência, com rendimento de trabalho.',
    conceito:
      'Rendimento habitualmente recebido em todos os trabalhos. Não inclui aposentadorias, aluguéis, programas sociais ou outras fontes.',
    fonte: { nome: 'IBGE · PNAD Contínua 2025 · Tabela 7536', tabela: 7536, url: sidra(7536) },
    populacao: {
      total: 101627000,
      tabela: 7537,
      url: sidra(7537),
      porInicioDaFaixa: {
        0: 5049000,
        5: 5088000,
        10: 10213000,
        20: 10174000,
        30: 10073000,
        40: 10702000,
        50: 9340000,
        60: 10497000,
        70: 10172000,
        80: 10143000,
        90: 5078000,
        95: 4077000,
        99: 1019000,
      },
    },
    limites: [
      { percentual: 5, limite: 498 },
      { percentual: 10, limite: 801 },
      { percentual: 20, limite: 1504 },
      { percentual: 30, limite: 1536 },
      { percentual: 40, limite: 1829 },
      { percentual: 50, limite: 2037 },
      { percentual: 60, limite: 2546 },
      { percentual: 70, limite: 3055 },
      { percentual: 80, limite: 4470 },
      { percentual: 90, limite: 6985 },
      { percentual: 95, limite: 10174 },
      { percentual: 99, limite: 24839 },
    ],
  },
};
