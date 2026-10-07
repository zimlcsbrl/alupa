import { describe, expect, it } from 'vitest';
import { apenasDigitos, normalizarCnpj, semAcentos, slugify } from './texto';

describe('slugify', () => {
  it('remove acentos e pontuação', () => {
    expect(slugify('São Paulo')).toBe('sao-paulo');
    expect(slugify("Alta Floresta D'Oeste")).toBe('alta-floresta-d-oeste');
    expect(slugify('  Mogi-Guaçu  ')).toBe('mogi-guacu');
  });

  it('mantém números', () => {
    expect(slugify('Lei 14.133/2021')).toBe('lei-14-133-2021');
  });
});

describe('semAcentos', () => {
  it('preserva letras base e cedilha vira c', () => {
    expect(semAcentos('Ação Pública — Ceará')).toBe('Acao Publica — Ceara');
  });
});

describe('apenasDigitos', () => {
  it('remove máscara', () => {
    expect(apenasDigitos('00.394.460/0058-87')).toBe('00394460005887');
  });
});

describe('normalizarCnpj', () => {
  it('aceita CNPJ válido com e sem máscara', () => {
    // CNPJ com dígitos verificadores válidos.
    expect(normalizarCnpj('00.394.460/0058-87')).toBe('00394460005887');
    expect(normalizarCnpj('00394460005887')).toBe('00394460005887');
  });

  it('rejeita dígitos verificadores errados, tamanho inválido e sequências repetidas', () => {
    expect(normalizarCnpj('00.394.460/0058-88')).toBeNull();
    expect(normalizarCnpj('123')).toBeNull();
    expect(normalizarCnpj('11111111111111')).toBeNull();
  });
});
