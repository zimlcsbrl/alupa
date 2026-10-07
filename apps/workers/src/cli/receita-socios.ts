/**
 * Cruza o quadro de sócios da Receita com as pessoas de CPF conhecido.
 * Sem --mes, usa o mês mais recente publicado. Baixa ~700 MB na primeira execução do mês.
 *
 *   pnpm --filter @alupa/workers receita:socios
 *   pnpm --filter @alupa/workers receita:socios -- --mes 2026-09
 */
import path from 'node:path';
import { parseArgs } from 'node:util';
import { receita } from '@alupa/connectors';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { cruzarSocios } from '../receita/socios';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const { values } = parseArgs({ options: { mes: { type: 'string' } } });
const db = createDb('direct');
const inicio = Date.now();
try {
  const mes = values.mes ?? (await receita.mesesDisponiveis()).at(-1);
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) throw new Error(`Mês inválido: ${mes}`);
  const r = await cruzarSocios(
    db,
    armazenamentoDoAmbiente(path.resolve(import.meta.dirname, '../../../..')),
    mes,
    log,
  );
  log.info({ ...r, minutos: Math.round((Date.now() - inicio) / 60000) }, 'cruzamento concluído');
} catch (erro) {
  log.error({ err: erro }, 'falha no cruzamento com a Receita');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
