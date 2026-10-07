import 'server-only';
import { createDb, type Database } from '@alupa/db';

// Uma conexão por processo; em dev, sobrevive ao recarregamento de módulos.
const global = globalThis as typeof globalThis & { __alupaDb?: Database };

export function db(): Database {
  global.__alupaDb ??= createDb('pooled');
  return global.__alupaDb;
}
