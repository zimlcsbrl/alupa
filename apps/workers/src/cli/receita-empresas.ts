/**
 * Completa o cadastro (razão social, capital, endereço…) das empresas encontradas no
 * cruzamento de sócios. Rode depois de receita:socios. Baixa ~7 GB na primeira execução do mês.
 *
 *   pnpm --filter @alupa/workers receita:empresas -- --mes 2026-09
 */
import path from 'node:path';
import { parseArgs } from 'node:util';
import { receita } from '@alupa/connectors';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { enriquecerEmpresas } from '../receita/empresas';

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
  const r = await enriquecerEmpresas(
    db,
    armazenamentoDoAmbiente(path.resolve(import.meta.dirname, '../../../..')),
    mes,
    log,
  );
  log.info({ ...r, minutos: Math.round((Date.now() - inicio) / 60000) }, 'empresas enriquecidas');
} catch (erro) {
  log.error({ err: erro }, 'falha ao enriquecer empresas');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
