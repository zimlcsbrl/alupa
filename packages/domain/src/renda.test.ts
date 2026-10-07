import { describe, expect, it } from 'vitest';
import {
  faixasDeRenda,
  lerValorEmReais,
  posicaoNaDistribuicao,
  rendaPorPessoa,
  type LimitePercentil,
} from './renda';

// Limites reais de 2025 da tabela 7438 do IBGE (renda domiciliar per capita).
const limites: LimitePercentil[] = [
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
];

describe('faixasDeRenda', () => {
  it('cobre 100% das pessoas, da base ao topo', () => {
    const faixas = faixasDeRenda(limites);
    expect(faixas).toHaveLength(13);
    expect(faixas[0]).toMatchObject({ de: 0, ate: 5, rendaMinima: null, rendaMaxima: 299 });
    expect(faixas.at(-1)).toMatchObject({
      de: 99,
      ate: 100,
      rendaMinima: 15214,
      rendaMaxima: null,
    });
    expect(faixas.reduce((soma, f) => soma + f.parcela, 0)).toBe(100);
  });

  it('não depende da ordem de entrada', () => {
    expect(faixasDeRenda([...limites].reverse())).toEqual(faixasDeRenda(limites));
  });
});

describe('posicaoNaDistribuicao', () => {
  it('usa a base abaixo da mediana', () => {
    expect(posicaoNaDistribuicao(800, limites)).toMatchObject({
      faixa: { de: 20, ate: 30 },
      destaque: 'entre os 30% com menor renda',
    });
  });

  it('usa o topo acima da mediana', () => {
    expect(posicaoNaDistribuicao(5000, limites)).toMatchObject({
      faixa: { de: 90, ate: 95 },
      destaque: 'entre os 10% com maior renda',
    });
  });

  it('renda igual ao limite fica na faixa que ele fecha', () => {
    expect(posicaoNaDistribuicao(1490, limites).faixa).toMatchObject({ de: 40, ate: 50 });
    expect(posicaoNaDistribuicao(1491, limites).faixa).toMatchObject({ de: 50, ate: 60 });
  });

  it('trata os extremos', () => {
    expect(posicaoNaDistribuicao(0, limites).destaque).toBe('entre os 5% com menor renda');
    expect(posicaoNaDistribuicao(50_000, limites).destaque).toBe('entre o 1% com maior renda');
  });

  it('rejeita valores inválidos', () => {
    expect(() => posicaoNaDistribuicao(-1, limites)).toThrow(RangeError);
    expect(() => posicaoNaDistribuicao(Number.NaN, limites)).toThrow(RangeError);
  });
});

describe('rendaPorPessoa', () => {
  it('divide a renda da casa pelos moradores', () => {
    expect(rendaPorPessoa(6000, 4)).toBe(1500);
  });

  it('exige ao menos um morador inteiro', () => {
    expect(() => rendaPorPessoa(1000, 0)).toThrow(RangeError);
    expect(() => rendaPorPessoa(1000, 2.5)).toThrow(RangeError);
  });
});

describe('lerValorEmReais', () => {
  it('aceita formatos comuns em português', () => {
    expect(lerValorEmReais('3000')).toBe(3000);
    expect(lerValorEmReais('3.000')).toBe(3000);
    expect(lerValorEmReais('3.000,50')).toBe(3000.5);
    expect(lerValorEmReais('R$ 2.500,00')).toBe(2500);
    expect(lerValorEmReais('1518,5')).toBe(1518.5);
  });

  it('recusa texto que não é valor', () => {
    expect(lerValorEmReais('')).toBeNull();
    expect(lerValorEmReais('abc')).toBeNull();
    expect(lerValorEmReais('-100')).toBeNull();
    expect(lerValorEmReais('3,000.50')).toBeNull();
  });
});
