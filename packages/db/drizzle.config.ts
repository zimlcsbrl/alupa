import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../.env' });

// Migrations usam a conexão direta do Neon (sem "-pooler").
// `drizzle-kit generate` não precisa de banco, por isso a URL pode faltar nesse caso.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  schemaFilter: ['ops', 'raw', 'core', 'pub'],
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? '' },
  casing: 'snake_case',
  strict: true,
  verbose: true,
});
