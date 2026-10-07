/**
 * Coleta seletiva de contratos do PNCP: lê todos os contratos publicados no período e grava os
 * de fornecedores ligados a pessoas acompanhadas. Rode depois de receita:socios e receita:empresas.
 *
 *   pnpm --filter @alupa/workers pncp:contratos -- --de 2026-07-01 --ate 2026-09-30
 *
 * Os dias são percorridos do mais recente para o mais antigo.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { carregarAlvos, coletarContratosDia } from '../pncp/contratos';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const { values } = parseArgs({ options: { de: { type: 'string' }, ate: { type: 'string' } } });
const DIA = /^\d{4}-\d{2}-\d{2}$/;
if (
  !values.de ||
  !values.ate ||
  !DIA.test(values.de) ||
  !DIA.test(values.ate) ||
  values.ate < values.de
) {
  log.error('Informe --de e --ate no formato AAAA-MM-DD.');
  process.exit(1);
}

const dias: string[] = [];
for (
  let d = new Date(`${values.ate}T00:00:00Z`);
  d >= new Date(`${values.de}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1)
) {
  dias.push(d.toISOString().slice(0, 10));
}

const db = createDb('direct');
const armazenamento = armazenamentoDoAmbiente(path.resolve(import.meta.dirname, '../../../..'));
const inicio = Date.now();
let lidos = 0;
let gravados = 0;
let falhas = 0;
try {
  const alvos = await carregarAlvos(db);
  log.info(
    { fornecedoresAcompanhados: alvos.size, dias: dias.length },
    'início da coleta seletiva',
  );
  for (const dia of dias) {
    try {
      const r = await coletarContratosDia(db, armazenamento, alvos, dia, log);
      lidos += r.lidos;
      gravados += r.gravados;
    } catch (erro) {
      falhas++;
      log.error({ dia, err: erro }, 'falha no dia; segue para o próximo');
    }
  }
} finally {
  await db.$client.end();
}
log.info(
  { lidos, gravados, falhas, minutos: Math.round((Date.now() - inicio) / 60000) },
  'coleta de contratos concluída',
);
process.exit(falhas > 0 ? 1 : 0);
