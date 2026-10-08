import { describe, expect, it } from 'vitest';
import { ehBemDeParticipacao, naturezaEmpresarial, REGRAS_SINAIS } from './sinais';

describe('regras de sinais', () => {
  it('cada regra explica o que verifica, por que importa e explicações legítimas', () => {
    for (const r of REGRAS_SINAIS) {
      expect(r.codigo).toMatch(/^[a-z-]+$/);
      expect(r.verificamos.length).toBeGreaterThan(30);
      expect(r.porQueImporta.length).toBeGreaterThan(30);
      expect(r.explicacoesComuns.length).toBeGreaterThanOrEqual(2);
      expect(r.criterio.length).toBeGreaterThan(10);
    }
    expect(new Set(REGRAS_SINAIS.map((r) => r.codigo)).size).toBe(REGRAS_SINAIS.length);
  });
});

describe('naturezaEmpresarial', () => {
  it('aceita empresas e recusa associações e entidades religiosas', () => {
    expect(naturezaEmpresarial(2062)).toBe(true); // Sociedade Empresária Limitada
    expect(naturezaEmpresarial(3999)).toBe(false); // Associação Privada
    expect(naturezaEmpresarial(3220)).toBe(false); // Organização Religiosa
    expect(naturezaEmpresarial(null)).toBe(false);
  });
});

describe('ehBemDeParticipacao', () => {
  it('reconhece os tipos de bem do TSE ligados a empresas', () => {
    expect(ehBemDeParticipacao('Quotas ou quinhões de capital')).toBe(true);
    expect(ehBemDeParticipacao('Ações (inclusive as provenientes de linha telefônica)')).toBe(true);
    expect(ehBemDeParticipacao('Caderneta de poupança')).toBe(false);
    // Tipo errado, descrição certa (caso real do TSE 2022).
    expect(ehBemDeParticipacao('99% DE QUOTAS DE CAPITAL DA EMPRESA SAURCONSTRUCAO')).toBe(true);
    expect(ehBemDeParticipacao('COTAS DA PADARIA DO JOÃO LTDA')).toBe(true);
    expect(ehBemDeParticipacao('APARTAMENTO EM NITERÓI')).toBe(false);
  });
});
