-- Extensões disponíveis tanto no Neon quanto em Postgres auto-hospedado.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gin;
--> statement-breakpoint
-- Camadas de dados ainda sem tabelas (ver Documentos/plano-desenvolvimento.md, Parte 3).
CREATE SCHEMA IF NOT EXISTS raw;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS core;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS pub;
--> statement-breakpoint
-- unaccent() não é IMMUTABLE e não pode ir direto em índices; este wrapper pode.
CREATE OR REPLACE FUNCTION pub.f_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'portuguese_unaccent') THEN
    CREATE TEXT SEARCH CONFIGURATION public.portuguese_unaccent (COPY = pg_catalog.portuguese);
    ALTER TEXT SEARCH CONFIGURATION public.portuguese_unaccent
      ALTER MAPPING FOR hword, hword_part, word WITH public.unaccent, portuguese_stem;
  END IF;
END
$$;
