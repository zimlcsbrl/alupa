/**
 * Recalcula os sinais para verificação publicados em /em-foco.
 * Rode depois de cada atualização de sócios, empresas ou contratos.
 *
 *   pnpm --filter @alupa/workers sinais
 */
import { createDb } from '@alupa/db';
import pino from 'pino';
import { gerarSinais } from '../sinais/gerar';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const db = createDb('direct');
try {
  log.info(await gerarSinais(db), 'sinais recalculados');
} catch (erro) {
  log.error({ err: erro }, 'falha ao gerar sinais');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
