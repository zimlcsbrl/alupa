CREATE TYPE "core"."situacao_editorial" AS ENUM('rascunho', 'publicado', 'retirado');--> statement-breakpoint
CREATE TABLE "core"."bem_declarado" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidatura_id" uuid NOT NULL,
	"ordem" integer NOT NULL,
	"codigo_tipo" integer,
	"tipo" text NOT NULL,
	"descricao" text,
	"valor" numeric(18, 2) NOT NULL,
	"atualizado_na_fonte_em" text,
	CONSTRAINT "bem_declarado_ordem" UNIQUE("candidatura_id","ordem")
);
--> statement-breakpoint
CREATE TABLE "core"."candidatura" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"ano" integer NOT NULL,
	"sq_candidato" text NOT NULL,
	"codigo_eleicao" text NOT NULL,
	"turno" integer,
	"cargo" text NOT NULL,
	"codigo_cargo" integer NOT NULL,
	"sigla_uf" text NOT NULL,
	"unidade_eleitoral" text NOT NULL,
	"unidade_eleitoral_nome" text,
	"numero" text,
	"nome_urna" text NOT NULL,
	"partido" text,
	"ocupacao" text,
	"situacao_candidatura" text,
	"resultado" text,
	"total_bens_declarados" numeric(18, 2),
	"quantidade_bens" integer DEFAULT 0 NOT NULL,
	"fonte_url" text NOT NULL,
	"gerado_na_fonte_em" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidatura_tse_unica" UNIQUE("ano","sq_candidato")
);
--> statement-breakpoint
CREATE TABLE "core"."materia_imprensa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"titulo" text NOT NULL,
	"veiculo" text NOT NULL,
	"publicada_em" date NOT NULL,
	"resumo" text,
	"situacao" "core"."situacao_editorial" DEFAULT 'rascunho' NOT NULL,
	"origem" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "materia_imprensa_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "core"."materia_pessoa" (
	"materia_id" uuid NOT NULL,
	"pessoa_id" uuid NOT NULL,
	CONSTRAINT "materia_pessoa_unica" UNIQUE("materia_id","pessoa_id")
);
--> statement-breakpoint
ALTER TABLE "core"."bem_declarado" ADD CONSTRAINT "bem_declarado_candidatura_id_candidatura_id_fk" FOREIGN KEY ("candidatura_id") REFERENCES "core"."candidatura"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."candidatura" ADD CONSTRAINT "candidatura_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."materia_pessoa" ADD CONSTRAINT "materia_pessoa_materia_id_materia_imprensa_id_fk" FOREIGN KEY ("materia_id") REFERENCES "core"."materia_imprensa"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."materia_pessoa" ADD CONSTRAINT "materia_pessoa_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidatura_pessoa_id_ano_index" ON "core"."candidatura" USING btree ("pessoa_id","ano");--> statement-breakpoint
CREATE INDEX "candidatura_ano_codigo_cargo_sigla_uf_index" ON "core"."candidatura" USING btree ("ano","codigo_cargo","sigla_uf");--> statement-breakpoint
CREATE INDEX "materia_imprensa_situacao_publicada_em_index" ON "core"."materia_imprensa" USING btree ("situacao","publicada_em");--> statement-breakpoint
CREATE INDEX "materia_pessoa_pessoa_id_index" ON "core"."materia_pessoa" USING btree ("pessoa_id");