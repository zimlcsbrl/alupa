/**
 * Importa as matérias de imprensa de dados/imprensa (ver dados/imprensa/LEIAME.md).
 *
 *   pnpm --filter @alupa/workers imprensa
 */
import { createDb } from '@alupa/db';
import pino from 'pino';
import { importarImprensa } from '../imprensa';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const db = createDb('direct');
try {
  const r = await importarImprensa(db);
  if (r.erros.length > 0) {
    log.error({ erros: r.erros }, 'arquivos com erro não foram gravados');
    process.exitCode = 1;
  }
  log.info({ arquivos: r.arquivos, materias: r.materias }, 'imprensa importada');
} finally {
  await db.$client.end();
}
