CREATE TYPE "core"."confianca_vinculo" AS ENUM('confirmada', 'possivel');--> statement-breakpoint
CREATE TABLE "core"."participacao_societaria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pessoa_id" uuid NOT NULL,
	"cnpj_basico" text NOT NULL,
	"razao_social" text,
	"nome_na_fonte" text NOT NULL,
	"cpf_parcial" text NOT NULL,
	"qualificacao_codigo" integer NOT NULL,
	"qualificacao" text,
	"entrada_em" date,
	"faixa_etaria" integer,
	"metodo" text NOT NULL,
	"confianca" "core"."confianca_vinculo" DEFAULT 'possivel' NOT NULL,
	"referencia" text NOT NULL,
	"documento_original_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participacao_unica" UNIQUE("pessoa_id","cnpj_basico","qualificacao_codigo","referencia")
);
--> statement-breakpoint
ALTER TABLE "core"."participacao_societaria" ADD CONSTRAINT "participacao_societaria_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."participacao_societaria" ADD CONSTRAINT "participacao_societaria_documento_original_id_documento_original_id_fk" FOREIGN KEY ("documento_original_id") REFERENCES "raw"."documento_original"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "participacao_societaria_cnpj_basico_index" ON "core"."participacao_societaria" USING btree ("cnpj_basico");--> statement-breakpoint
CREATE INDEX "participacao_societaria_pessoa_id_index" ON "core"."participacao_societaria" USING btree ("pessoa_id");