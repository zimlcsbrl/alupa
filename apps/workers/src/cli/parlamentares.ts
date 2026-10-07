/**
 * Importa deputados federais e senadores em exercício e registra a chave de identidade
 * dos deputados (HMAC do CPF), usada para ligar candidaturas do TSE.
 *
 *   pnpm --filter @alupa/workers parlamentares
 */
import { createDb } from '@alupa/db';
import pino from 'pino';
import { importarParlamentares, vincularIdentidadeDeputados } from '../parlamentares';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const segredo = process.env.ALUPA_CHAVE_IDENTIDADE ?? '';
const db = createDb('direct');
try {
  log.info(await importarParlamentares(db), 'parlamentares importados');
  log.info(await vincularIdentidadeDeputados(db, segredo), 'identidade dos deputados vinculada');
} catch (erro) {
  log.error({ err: erro }, 'falha ao importar parlamentares');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
