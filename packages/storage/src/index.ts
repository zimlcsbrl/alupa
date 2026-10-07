import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Original guardado: onde está, como verificar e quanto ocupa. */
export interface ObjetoGuardado {
  chave: string;
  sha256: string;
  tamanhoBytes: number;
  contentType: string | null;
}

export interface Armazenamento {
  guardar(
    chave: string,
    conteudo: string | Uint8Array,
    contentType?: string | null,
  ): Promise<ObjetoGuardado>;
  ler(chave: string): Promise<Buffer>;
}

export function sha256(conteudo: string | Uint8Array): string {
  return createHash('sha256').update(conteudo).digest('hex');
}

/** Chaves sempre relativas e sem "..", para nunca escapar do diretório raiz. */
function validarChave(chave: string) {
  const normalizada = path.posix.normalize(chave);
  if (normalizada.startsWith('/') || normalizada.startsWith('..') || normalizada !== chave) {
    throw new Error(`Chave de armazenamento inválida: ${chave}`);
  }
}

/**
 * Armazenamento em disco local, para desenvolvimento sem MinIO/R2.
 * A escrita é atômica (arquivo temporário + rename) para não deixar originais pela metade.
 */
export function armazenamentoLocal(raiz: string): Armazenamento {
  return {
    async guardar(chave, conteudo, contentType = null) {
      validarChave(chave);
      const destino = path.join(raiz, chave);
      await mkdir(path.dirname(destino), { recursive: true });
      const temporario = `${destino}.${process.pid}.tmp`;
      await writeFile(temporario, conteudo);
      await rename(temporario, destino);
      return {
        chave,
        sha256: sha256(conteudo),
        tamanhoBytes:
          typeof conteudo === 'string' ? Buffer.byteLength(conteudo) : conteudo.byteLength,
        contentType,
      };
    },
    async ler(chave) {
      validarChave(chave);
      return readFile(path.join(raiz, chave));
    },
  };
}

/**
 * Escolhe o armazenamento pelo ambiente.
 * STORAGE_DRIVER=local (padrão em dev) grava em STORAGE_LOCAL_DIR (padrão: .data/storage na raiz do repositório).
 * O driver S3 (MinIO/R2) será adicionado quando houver bucket para testá-lo.
 */
export function armazenamentoDoAmbiente(raizRepositorio: string): Armazenamento {
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  if (driver === 'local') {
    return armazenamentoLocal(
      path.resolve(raizRepositorio, process.env.STORAGE_LOCAL_DIR ?? '.data/storage'),
    );
  }
  throw new Error(`STORAGE_DRIVER "${driver}" ainda não implementado. Use "local".`);
}
