CREATE TYPE "core"."situacao_sinal" AS ENUM('nao_verificado', 'em_verificacao', 'explicado', 'descartado', 'virou_caso');--> statement-breakpoint
CREATE TABLE "core"."sinal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"regra" text NOT NULL,
	"chave" text NOT NULL,
	"pessoa_id" uuid,
	"organizacao_id" uuid,
	"contrato_id" uuid,
	"evidencia" jsonb NOT NULL,
	"valor_referencia" numeric(18, 2),
	"situacao" "core"."situacao_sinal" DEFAULT 'nao_verificado' NOT NULL,
	"nota_editorial" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"detectado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sinal_unico" UNIQUE("regra","chave")
);
--> statement-breakpoint
ALTER TABLE "core"."sinal" ADD CONSTRAINT "sinal_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."sinal" ADD CONSTRAINT "sinal_organizacao_id_organizacao_id_fk" FOREIGN KEY ("organizacao_id") REFERENCES "core"."organizacao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."sinal" ADD CONSTRAINT "sinal_contrato_id_contrato_id_fk" FOREIGN KEY ("contrato_id") REFERENCES "core"."contrato"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sinal_regra_ativo_index" ON "core"."sinal" USING btree ("regra","ativo");--> statement-breakpoint
CREATE INDEX "sinal_pessoa_id_index" ON "core"."sinal" USING btree ("pessoa_id");