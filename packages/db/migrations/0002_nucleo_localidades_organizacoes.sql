CREATE SCHEMA IF NOT EXISTS "raw";
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "core";
--> statement-breakpoint
CREATE TYPE "core"."esfera" AS ENUM('federal', 'estadual', 'distrital', 'municipal');--> statement-breakpoint
CREATE TYPE "core"."poder" AS ENUM('executivo', 'legislativo', 'judiciario', 'ministerio_publico', 'defensoria', 'tribunal_de_contas', 'outro');--> statement-breakpoint
CREATE TABLE "raw"."documento_original" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fonte_id" uuid NOT NULL,
	"url" text NOT NULL,
	"id_na_fonte" text,
	"sha256" text NOT NULL,
	"chave_storage" text NOT NULL,
	"content_type" text,
	"tamanho_bytes" bigint,
	"obtido_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documento_original_fonteId_sha256_unique" UNIQUE("fonte_id","sha256")
);
--> statement-breakpoint
CREATE TABLE "core"."ente_federativo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"esfera" "core"."esfera" NOT NULL,
	"codigo_ibge" text,
	"nome" text NOT NULL,
	"sigla_uf" text,
	"uf_id" uuid,
	"slug" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ente_federativo_codigoIbge_unique" UNIQUE("codigo_ibge"),
	CONSTRAINT "ente_federativo_slug_unique" UNIQUE("slug"),
	CONSTRAINT "ente_codigo_ibge_formato" CHECK ("core"."ente_federativo"."codigo_ibge" IS NULL OR "core"."ente_federativo"."codigo_ibge" ~ '^[0-9]{2}([0-9]{5})?$')
);
--> statement-breakpoint
CREATE TABLE "core"."identificador_externo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sistema" text NOT NULL,
	"valor" text NOT NULL,
	"entidade_tipo" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identificador_externo_sistema_valor_entidadeTipo_unique" UNIQUE("sistema","valor","entidade_tipo")
);
--> statement-breakpoint
CREATE TABLE "core"."organizacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnpj" text,
	"razao_social" text NOT NULL,
	"nome_fantasia" text,
	"slug" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizacao_cnpj_unique" UNIQUE("cnpj"),
	CONSTRAINT "organizacao_slug_unique" UNIQUE("slug"),
	CONSTRAINT "organizacao_cnpj_formato" CHECK ("core"."organizacao"."cnpj" IS NULL OR "core"."organizacao"."cnpj" ~ '^[0-9]{14}$')
);
--> statement-breakpoint
CREATE TABLE "core"."orgao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizacao_id" uuid,
	"ente_id" uuid NOT NULL,
	"poder" "core"."poder" NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orgao_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "raw"."documento_original" ADD CONSTRAINT "documento_original_fonte_id_fonte_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "ops"."fonte"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."ente_federativo" ADD CONSTRAINT "ente_federativo_uf_id_ente_federativo_id_fk" FOREIGN KEY ("uf_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."orgao" ADD CONSTRAINT "orgao_organizacao_id_organizacao_id_fk" FOREIGN KEY ("organizacao_id") REFERENCES "core"."organizacao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."orgao" ADD CONSTRAINT "orgao_ente_id_ente_federativo_id_fk" FOREIGN KEY ("ente_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documento_original_fonte_id_id_na_fonte_index" ON "raw"."documento_original" USING btree ("fonte_id","id_na_fonte");--> statement-breakpoint
CREATE INDEX "ente_federativo_sigla_uf_index" ON "core"."ente_federativo" USING btree ("sigla_uf");--> statement-breakpoint
CREATE INDEX "ente_federativo_nome_trgm" ON "core"."ente_federativo" USING gin (pub.f_unaccent("nome") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "identificador_externo_entidade_tipo_entidade_id_index" ON "core"."identificador_externo" USING btree ("entidade_tipo","entidade_id");--> statement-breakpoint
CREATE INDEX "organizacao_razao_social_trgm" ON "core"."organizacao" USING gin (pub.f_unaccent("razao_social") gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "orgao_ente_id_index" ON "core"."orgao" USING btree ("ente_id");--> statement-breakpoint
CREATE INDEX "orgao_organizacao_id_index" ON "core"."orgao" USING btree ("organizacao_id");