import { sql } from 'drizzle-orm';
import { bigint, index, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { fonte } from './ops';

/** Camada original: metadados dos arquivos e respostas preservados no armazenamento de objetos. */
export const raw = pgSchema('raw');

export const documentoOriginal = raw.table(
  'documento_original',
  {
    id: uuid()
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    fonteId: uuid()
      .notNull()
      .references(() => fonte.id),
    url: text().notNull(),
    /** Identificador do registro na fonte, quando houver. */
    idNaFonte: text(),
    /** SHA-256 do conteúdo, em hexadecimal. */
    sha256: text().notNull(),
    /** Chave do objeto no R2/MinIO. */
    chaveStorage: text().notNull(),
    contentType: text(),
    tamanhoBytes: bigint({ mode: 'number' }),
    obtidoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.fonteId, t.sha256), index().on(t.fonteId, t.idNaFonte)],
);
