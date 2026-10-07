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
