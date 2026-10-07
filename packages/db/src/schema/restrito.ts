import { pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { pessoa } from './core';

/**
 * Dados pessoais de acesso restrito. Só os workers leem este schema; o site nunca.
 * Antes de produção, conceda acesso apenas à role dos workers (ver plano, Parte 3).
 */
export const restrito = pgSchema('restrito');

export const documentoPessoa = restrito.table('documento_pessoa', {
  pessoaId: uuid()
    .primaryKey()
    .references(() => pessoa.id, { onDelete: 'cascade' }),
  /** CPF completo, cifrado com AES-256-GCM (ALUPA_CHAVE_CIFRA). Nunca em claro. */
  cpfCifrado: text().notNull(),
  /** "***.456.789-**": formato do Portal da Transparência e da base de sócios da Receita. */
  cpfMascarado: text().notNull(),
  /** De onde veio o CPF, ex.: "tse:2026". */
  fonte: text().notNull(),
  atualizadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
