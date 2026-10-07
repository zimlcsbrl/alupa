/**
 * Importa os deputados estaduais do RJ em exercício (ALERJ).
 * Rode depois de importar as candidaturas de 2022 do RJ (tse:candidaturas --ano 2022 --ufs RJ).
 *
 *   pnpm --filter @alupa/workers alerj
 */
import { createDb } from '@alupa/db';
import pino from 'pino';
import { importarAlerj } from '../alerj';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const db = createDb('direct');
try {
  log.info(await importarAlerj(db, log), 'deputados estaduais do RJ importados');
} catch (erro) {
  log.error({ err: erro }, 'falha ao importar a ALERJ');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
