import { describe, expect, it } from 'vitest';
import { ehCsvDeUf, reaisTse, valorTse } from './tse';

describe('valorTse', () => {
  it('trata marcadores de ausência do TSE', () => {
    expect(valorTse('#NULO')).toBeNull();
    expect(valorTse('#NULO#')).toBeNull();
    expect(valorTse('#NE')).toBeNull();
    expect(valorTse('  ')).toBeNull();
    expect(valorTse('PL')).toBe('PL');
  });
});

describe('reaisTse', () => {
  it('converte o formato brasileiro sem perder centavos', () => {
    expect(reaisTse('60000,00')).toBe('60000.00');
    expect(reaisTse('1.234.567,89')).toBe('1234567.89');
    expect(reaisTse('276898,4')).toBe('276898.40');
    expect(reaisTse('abc')).toBeNull();
  });
});

describe('ehCsvDeUf', () => {
  it('aceita arquivos por UF e ignora o consolidado', () => {
    expect(ehCsvDeUf('consulta_cand_2026_RJ.csv', 'consulta_cand_2026')).toBe(true);
    expect(ehCsvDeUf('consulta_cand_2026_BRASIL.csv', 'consulta_cand_2026')).toBe(false);
    expect(ehCsvDeUf('leiame.pdf', 'consulta_cand_2026')).toBe(false);
  });
});
