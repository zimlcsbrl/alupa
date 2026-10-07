ALTER TABLE "core"."organizacao" ADD COLUMN "natureza_juridica_codigo" integer;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "natureza_juridica" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "capital_social" numeric(18, 2);--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "porte" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "situacao_cadastral" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "situacao_cadastral_em" date;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "inicio_atividade" date;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "cnae_principal" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "cnae_principal_descricao" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "endereco" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "cep" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "municipio_nome" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "sigla_uf" text;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "endereco_protegido" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "core"."organizacao" ADD COLUMN "referencia_receita" text;--> statement-breakpoint
ALTER TABLE "core"."participacao_societaria" ADD COLUMN "organizacao_id" uuid;--> statement-breakpoint
ALTER TABLE "core"."participacao_societaria" ADD CONSTRAINT "participacao_societaria_organizacao_id_organizacao_id_fk" FOREIGN KEY ("organizacao_id") REFERENCES "core"."organizacao"("id") ON DELETE no action ON UPDATE no action;