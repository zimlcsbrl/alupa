import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

/**
 * Cria o cliente do banco.
 *
 * - `pooled` (padrão): usa DATABASE_URL (PgBouncer do Neon em modo transação).
 *   Prepared statements nomeados não funcionam nesse modo, por isso `prepare: false`.
 * - `direct`: usa DATABASE_URL_UNPOOLED, para workers de longa duração e COPY em massa.
 */
export function createDb(mode: 'pooled' | 'direct' = 'pooled') {
  const url = mode === 'pooled' ? process.env.DATABASE_URL : process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error(
      mode === 'pooled' ? 'DATABASE_URL não definida.' : 'DATABASE_URL_UNPOOLED não definida.',
    );
  }

  const sql = postgres(url, {
    prepare: mode === 'direct',
    max: mode === 'pooled' ? 10 : 4,
  });

  return drizzle(sql, { schema, casing: 'snake_case' });
}
