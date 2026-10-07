/**
 * Importa candidaturas e bens declarados do TSE.
 *
 *   pnpm --filter @alupa/workers tse:candidaturas -- --ano 2026
 *   pnpm --filter @alupa/workers tse:candidaturas -- --ano 2024 --cargos 11
 *   pnpm --filter @alupa/workers tse:candidaturas -- --ano 2022 --ufs RJ,SP
 *
 * Sem --ufs, importa todas as UFs; sem --cargos, todos os cargos.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { importarEleicao } from '../tse/candidaturas';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const { values } = parseArgs({
  options: { ano: { type: 'string' }, ufs: { type: 'string' }, cargos: { type: 'string' } },
});
const ano = Number(values.ano);
if (![2022, 2024, 2026].includes(ano)) {
  log.error('Informe --ano 2022, 2024 ou 2026.');
  process.exit(1);
}
const lista = (v?: string) =>
  v
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

const db = createDb('direct');
const inicio = Date.now();
try {
  const r = await importarEleicao(
    db,
    armazenamentoDoAmbiente(path.resolve(import.meta.dirname, '../../../..')),
    {
      ano,
      ufs: lista(values.ufs),
      cargos: lista(values.cargos)?.map(Number) ?? null,
      segredo: process.env.ALUPA_CHAVE_IDENTIDADE ?? '',
      chaveCifra: process.env.ALUPA_CHAVE_CIFRA ?? '',
    },
    log,
  );
  log.info({ ...r, segundos: Math.round((Date.now() - inicio) / 1000) }, 'importação concluída');
} catch (erro) {
  log.error({ err: erro }, 'falha na importação do TSE');
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
