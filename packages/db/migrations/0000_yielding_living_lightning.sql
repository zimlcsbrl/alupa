CREATE SCHEMA "ops";
--> statement-breakpoint
CREATE TYPE "ops"."situacao_coleta" AS ENUM('agendada', 'em_execucao', 'concluida', 'falhou', 'cancelada');--> statement-breakpoint
CREATE TABLE "ops"."checkpoint" (
	"chave" text PRIMARY KEY NOT NULL,
	"fonte_id" uuid NOT NULL,
	"valor" jsonb NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops"."coleta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fonte_id" uuid NOT NULL,
	"tarefa" text NOT NULL,
	"situacao" "ops"."situacao_coleta" DEFAULT 'agendada' NOT NULL,
	"parametros" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"iniciada_em" timestamp with time zone,
	"concluida_em" timestamp with time zone,
	"registros_lidos" integer DEFAULT 0 NOT NULL,
	"registros_gravados" integer DEFAULT 0 NOT NULL,
	"erro" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ops"."fonte" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nome" text NOT NULL,
	"url_documentacao" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fonte_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "ops"."checkpoint" ADD CONSTRAINT "checkpoint_fonte_id_fonte_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "ops"."fonte"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ops"."coleta" ADD CONSTRAINT "coleta_fonte_id_fonte_id_fk" FOREIGN KEY ("fonte_id") REFERENCES "ops"."fonte"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coleta_fonte_id_criado_em_index" ON "ops"."coleta" USING btree ("fonte_id","criado_em");