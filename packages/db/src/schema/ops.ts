import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Operação das coletas: fontes, execuções e checkpoints. */
export const ops = pgSchema('ops');

export const situacaoColeta = ops.enum('situacao_coleta', [
  'agendada',
  'em_execucao',
  'concluida',
  'falhou',
  'cancelada',
]);

export const fonte = ops.table('fonte', {
  id: uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  /** Identificador estável usado no código, ex.: "pncp", "camara". */
  codigo: text().notNull().unique(),
  nome: text().notNull(),
  urlDocumentacao: text(),
  criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const coleta = ops.table(
  'coleta',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fonteId: uuid()
      .notNull()
      .references(() => fonte.id),
    /** Tipo de job, ex.: "pncp:descobrir". */
    tarefa: text().notNull(),
    situacao: situacaoColeta().notNull().default('agendada'),
    parametros: jsonb().notNull().default({}),
    iniciadaEm: timestamp({ withTimezone: true }),
    concluidaEm: timestamp({ withTimezone: true }),
    registrosLidos: integer().notNull().default(0),
    registrosGravados: integer().notNull().default(0),
    erro: text(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.fonteId, t.criadoEm)],
);

export const checkpoint = ops.table('checkpoint', {
  /** Chave do cursor, ex.: "pncp:contratacoes:publicacao". */
  chave: text().primaryKey(),
  fonteId: uuid()
    .notNull()
    .references(() => fonte.id),
  valor: jsonb().notNull(),
  atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
