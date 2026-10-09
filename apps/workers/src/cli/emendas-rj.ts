/**
 * Importa as emendas impositivas estaduais do RJ (2024–2026) publicadas no RedePlan.
 * Rode depois de tse:candidaturas e alerj, para ligar os autores às pessoas.
 *
 *   pnpm --filter @alupa/workers emendas:rj
 */
import path from 'node:path';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { importarEmendasRj } from '../emendas/rj';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const db = createDb('direct');
const armazenamento = armazenamentoDoAmbiente(path.resolve(import.meta.dirname, '../../../..'));
try {
  log.info(await importarEmendasRj(db, armazenamento, log), 'emendas do RJ importadas');
} catch (erro) {
  // O erro do Drizzle traz a consulta inteira; a causa do Postgres vem em `cause`.
  const causa = erro instanceof Error ? erro.cause : undefined;
  log.error({ err: causa ?? erro }, 'falha ao importar emendas do RJ');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
