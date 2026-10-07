import { describe, expect, it } from 'vitest';
import { chaveDeIdentidade, chaveDeTitulo, cifrar, decifrar, mascararCpf } from './identidade';

const segredo = 'a'.repeat(44);

describe('chaveDeIdentidade', () => {
  it('é estável e ignora a máscara do CPF', () => {
    const a = chaveDeIdentidade('123.456.789-09', segredo);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(chaveDeIdentidade('12345678909', segredo)).toBe(a);
  });

  it('depende do segredo e não contém o CPF', () => {
    const a = chaveDeIdentidade('12345678909', segredo)!;
    expect(chaveDeIdentidade('12345678909', 'b'.repeat(44))).not.toBe(a);
    expect(a).not.toContain('12345678909');
  });

  it('descarta CPFs ausentes, mascarados ou inválidos', () => {
    expect(chaveDeIdentidade(null, segredo)).toBeNull();
    expect(chaveDeIdentidade('-4', segredo)).toBeNull();
    expect(chaveDeIdentidade('***.456.789-**', segredo)).toBeNull();
    expect(chaveDeIdentidade('00000000000', segredo)).toBeNull();
  });

  it('recusa segredo fraco', () => {
    expect(() => chaveDeIdentidade('12345678909', 'curto')).toThrow();
  });
});

describe('chaveDeTitulo', () => {
  it('gera chave distinta da do CPF para os mesmos dígitos', () => {
    const t = chaveDeTitulo('123456789012', segredo);
    expect(t).toMatch(/^[0-9a-f]{64}$/);
    expect(t).not.toBe(chaveDeIdentidade('12345678901', segredo));
  });

  it('descarta títulos inválidos', () => {
    expect(chaveDeTitulo('-4', segredo)).toBeNull();
    expect(chaveDeTitulo('12345', segredo)).toBeNull();
    expect(chaveDeTitulo(null, segredo)).toBeNull();
  });
});

describe('mascararCpf', () => {
  it('mostra só os 6 dígitos do meio, como o Portal da Transparência', () => {
    expect(mascararCpf('123.456.789-09')).toBe('***.456.789-**');
    expect(mascararCpf('-4')).toBeNull();
  });
});

describe('cifrar / decifrar', () => {
  const chave = Buffer.alloc(32, 7).toString('base64');

  it('ida e volta, com valor diferente a cada cifragem', () => {
    const a = cifrar('12345678909', chave);
    const b = cifrar('12345678909', chave);
    expect(a).not.toBe(b);
    expect(a).not.toContain('12345678909');
    expect(decifrar(a, chave)).toBe('12345678909');
  });

  it('detecta adulteração e chave errada', () => {
    const a = cifrar('12345678909', chave);
    const adulterado = a.slice(0, -4) + (a.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect(() => decifrar(adulterado, chave)).toThrow();
    expect(() => decifrar(a, Buffer.alloc(32, 8).toString('base64'))).toThrow();
  });

  it('recusa chave inválida', () => {
    expect(() => cifrar('x', 'curta')).toThrow(/32 bytes/);
  });
});
