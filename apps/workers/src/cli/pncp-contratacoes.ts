/**
 * Coleta contratações publicadas no PNCP em um intervalo de dias.
 *
 *   pnpm --filter @alupa/workers pncp:contratacoes -- --de 2026-09-29 --ate 2026-09-30 --modalidades 6,8
 *
 * Sem --modalidades, percorre todas. Sem datas, coleta ontem.
 */
import path from 'node:path';
import { parseArgs } from 'node:util';
import { pncp } from '@alupa/connectors';
import { createDb } from '@alupa/db';
import { armazenamentoDoAmbiente } from '@alupa/storage';
import pino from 'pino';
import { carregarReferencias, coletarDia } from '../pncp/contratacoes';

const log = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : { target: 'pino-pretty' },
});

const ontem = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
const { values } = parseArgs({
  options: {
    de: { type: 'string', default: ontem },
    ate: { type: 'string' },
    modalidades: { type: 'string' },
  },
});

const DIA = /^\d{4}-\d{2}-\d{2}$/;
const de = values.de!;
const ate = values.ate ?? de;
if (!DIA.test(de) || !DIA.test(ate) || ate < de) {
  log.error({ de, ate }, 'Datas inválidas: use AAAA-MM-DD e --ate maior ou igual a --de.');
  process.exit(1);
}

const modalidades = values.modalidades
  ? values.modalidades.split(',').map((m) => Number(m.trim()) as pncp.CodigoModalidade)
  : pncp.CODIGOS_MODALIDADE;
const invalidas = modalidades.filter((m) => !(m in pncp.MODALIDADES));
if (invalidas.length > 0) {
  log.error({ invalidas }, 'Modalidades inexistentes.');
  process.exit(1);
}

function dias(inicio: string, fim: string) {
  const lista: string[] = [];
  for (
    let d = new Date(`${inicio}T00:00:00Z`);
    d <= new Date(`${fim}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    lista.push(d.toISOString().slice(0, 10));
  }
  return lista;
}

const raizRepositorio = path.resolve(import.meta.dirname, '../../../..');
const db = createDb('direct');
const armazenamento = armazenamentoDoAmbiente(raizRepositorio);

let totalLidos = 0;
let totalGravados = 0;
let falhas = 0;
const inicio = Date.now();

try {
  const ref = await carregarReferencias(db);
  for (const dia of dias(de, ate)) {
    for (const modalidade of modalidades) {
      try {
        const r = await coletarDia(db, armazenamento, ref, dia, modalidade, log);
        totalLidos += r.lidos;
        totalGravados += r.gravados;
        if (r.lidos > 0)
          log.info({ dia, modalidade: pncp.MODALIDADES[modalidade], ...r }, 'coletado');
      } catch (erro) {
        falhas++;
        log.error({ dia, modalidade, err: erro }, 'falha na coleta; segue para a próxima');
      }
    }
  }
} finally {
  await db.$client.end();
}

log.info(
  {
    lidos: totalLidos,
    gravados: totalGravados,
    falhas,
    segundos: Math.round((Date.now() - inicio) / 1000),
  },
  'coleta finalizada',
);
process.exit(falhas > 0 ? 1 : 0);
