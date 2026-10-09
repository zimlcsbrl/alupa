import type { Metadata } from 'next';
import { isIndexable } from './site';

/** Só a listagem canônica entra no índice; buscas, filtros e paginação ficam fora. */
export function robotsDaListagem(
  params: Record<string, string | string[] | undefined>,
): Metadata['robots'] {
  const filtrada = ['q', 'uf', 'cargo', 'municipio', 'pagina', 'regra'].some((key) => {
    const value = params[key];
    return Array.isArray(value) ? value.some((v) => v.trim() !== '') : !!value?.trim();
  });
  return { index: isIndexable && !filtrada, follow: isIndexable };
}
