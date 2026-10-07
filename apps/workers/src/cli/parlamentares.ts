/**
 * Importa deputados federais e senadores em exercício.
 *
 *   pnpm --filter @alupa/workers parlamentares
 */
import { createDb } from '@alupa/db';
import pino from 'pino';
import { importarParlamentares } from '../parlamentares';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const db = createDb('direct');
try {
  const resultado = await importarParlamentares(db);
  log.info(resultado, 'parlamentares importados');
} catch (erro) {
  log.error({ err: erro }, 'falha ao importar parlamentares');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
