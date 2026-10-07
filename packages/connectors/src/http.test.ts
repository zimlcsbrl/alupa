import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscar, ErroFonte } from './http';

const resposta = (status: number, corpo = '', cabecalhos: Record<string, string> = {}) =>
  new Response(status === 204 ? null : corpo, { status, headers: cabecalhos });

afterEach(() => vi.unstubAllGlobals());

describe('buscar', () => {
  it('espera o Retry-After em HTTP 429 e tenta de novo', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(resposta(429, '', { 'retry-after': '0' }))
      .mockResolvedValueOnce(resposta(200, '{"ok":true}', { 'content-type': 'application/json' }));
    vi.stubGlobal('fetch', fetch);

    const r = await buscar('https://exemplo.test/a');
    expect(r.texto).toBe('{"ok":true}');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('desiste após o limite de tentativas em 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(429, '', { 'retry-after': '0' })));
    await expect(buscar('https://exemplo.test/b', { tentativasLimite: 2 })).rejects.toMatchObject({
      status: 429,
    });
  });

  it('não repete erros 4xx', async () => {
    const fetch = vi.fn().mockResolvedValue(resposta(404));
    vi.stubGlobal('fetch', fetch);
    await expect(buscar('https://exemplo.test/c')).rejects.toBeInstanceOf(ErroFonte);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('devolve corpo vazio em 204', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta(204)));
    expect((await buscar('https://exemplo.test/d')).texto).toBe('');
  });
});
