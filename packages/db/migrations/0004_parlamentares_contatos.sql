CREATE TYPE "core"."canal_contato" AS ENUM('email', 'telefone', 'site');--> statement-breakpoint
CREATE TYPE "core"."cargo" AS ENUM('deputado_federal', 'senador');--> statement-breakpoint
CREATE TYPE "core"."situacao_contato" AS ENUM('publicado', 'desatualizado', 'invalido', 'nao_encontrado');--> statement-breakpoint
CREATE TYPE "core"."tipo_contato" AS ENUM('gabinete', 'assessoria', 'institucional', 'atendimento', 'outro');--> statement-breakpoint
CREATE TABLE "core"."contato_publico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entidade_tipo" text NOT NULL,
	"entidade_id" uuid NOT NULL,
	"tipo" "core"."tipo_contato" NOT NULL,
	"canal" "core"."canal_contato" NOT NULL,
	"valor" text NOT NULL,
	"rotulo" text,
	"fonte_url" text NOT NULL,
	"verificado_em" timestamp with time zone NOT NULL,
	"situacao" "core"."situacao_contato" DEFAULT 'publicado' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contato_publico_entidadeTipo_entidadeId_canal_valor_unique" UNIQUE("entidade_tipo","entidade_id","canal","valor"),
	CONSTRAINT "contato_entidade_tipo" CHECK ("core"."contato_publico"."entidade_tipo" IN ('pessoa', 'orgao'))
);
--> statement-breakpoint
CREATE TABLE "core"."mandato" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"cargo" "core"."cargo" NOT NULL,
	"ente_id" uuid NOT NULL,
	"uf_id" uuid,
	"partido" text,
	"inicio" date NOT NULL,
	"fim" date,
	"situacao" text,
	"id_na_fonte" text NOT NULL,
	"fonte_url" text,
	"verificado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mandato_idNaFonte_unique" UNIQUE("id_na_fonte")
);
--> statement-breakpoint
CREATE TABLE "core"."pessoa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"nome_completo" text,
	"slug" text NOT NULL,
	"foto_url" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pessoa_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "core"."mandato" ADD CONSTRAINT "mandato_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."mandato" ADD CONSTRAINT "mandato_ente_id_ente_federativo_id_fk" FOREIGN KEY ("ente_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."mandato" ADD CONSTRAINT "mandato_uf_id_ente_federativo_id_fk" FOREIGN KEY ("uf_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contato_publico_entidade_tipo_entidade_id_index" ON "core"."contato_publico" USING btree ("entidade_tipo","entidade_id");--> statement-breakpoint
CREATE INDEX "mandato_pessoa_id_index" ON "core"."mandato" USING btree ("pessoa_id");--> statement-breakpoint
CREATE INDEX "mandato_cargo_uf_id_index" ON "core"."mandato" USING btree ("cargo","uf_id");--> statement-breakpoint
CREATE INDEX "pessoa_nome_trgm" ON "core"."pessoa" USING gin (pub.f_unaccent("nome") gin_trgm_ops);