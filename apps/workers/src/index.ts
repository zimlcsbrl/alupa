import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
// BullMQ exige maxRetriesPerRequest: null nas conexões dos workers.
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const FILA_SISTEMA = 'sistema';

// Fila de verificação da infraestrutura. Os conectores (PNCP etc.) entram nas próximas fases.
const fila = new Queue(FILA_SISTEMA, { connection });

const worker = new Worker(
  FILA_SISTEMA,
  async (job) => {
    log.info({ job: job.name, id: job.id }, 'job recebido');
    return { ok: true, em: new Date().toISOString() };
  },
  { connection },
);

worker.on('failed', (job, err) => log.error({ job: job?.name, err }, 'job falhou'));

await fila.add('ping', {}, { removeOnComplete: 100, removeOnFail: 100 });
log.info({ redisUrl }, 'workers iniciados');

async function encerrar() {
  log.info('encerrando workers');
  await worker.close();
  await fila.close();
  await connection.quit();
  process.exit(0);
}

process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
