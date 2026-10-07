import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { armazenamentoLocal, sha256 } from './index';

const raiz = await mkdtemp(path.join(tmpdir(), 'alupa-storage-'));
afterAll(() => rm(raiz, { recursive: true, force: true }));

describe('armazenamentoLocal', () => {
  const armazenamento = armazenamentoLocal(raiz);

  it('guarda, devolve metadados e lê o mesmo conteúdo', async () => {
    const conteudo = '{"ok":true,"texto":"ação"}';
    const guardado = await armazenamento.guardar('pncp/teste/a.json', conteudo, 'application/json');
    expect(guardado.sha256).toBe(sha256(conteudo));
    expect(guardado.tamanhoBytes).toBe(Buffer.byteLength(conteudo));
    expect((await armazenamento.ler('pncp/teste/a.json')).toString()).toBe(conteudo);
  });

  it('recusa chaves que escapam da raiz', async () => {
    await expect(armazenamento.guardar('../fora.json', 'x')).rejects.toThrow();
    await expect(armazenamento.guardar('/absoluto.json', 'x')).rejects.toThrow();
    await expect(armazenamento.guardar('a/../../b.json', 'x')).rejects.toThrow();
  });
});
