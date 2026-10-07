CREATE TABLE "core"."contrato" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_controle_pncp" text NOT NULL,
	"numero_controle_pncp_compra" text,
	"ano" integer NOT NULL,
	"sequencial" integer NOT NULL,
	"numero" text,
	"processo" text,
	"objeto" text,
	"orgao_cnpj" text NOT NULL,
	"orgao_nome" text NOT NULL,
	"unidade_nome" text,
	"sigla_uf" text,
	"codigo_ibge_municipio" text,
	"fornecedor_tipo" text,
	"fornecedor_cnpj" text,
	"fornecedor_nome" text,
	"fornecedor_id" uuid,
	"tipo_contrato" text,
	"categoria" text,
	"valor_inicial" numeric(18, 2),
	"valor_global" numeric(18, 2),
	"valor_acumulado" numeric(18, 2),
	"assinado_em" date,
	"vigencia_inicio" date,
	"vigencia_fim" date,
	"emenda_parlamentar" boolean,
	"publicado_em" timestamp with time zone NOT NULL,
	"atualizado_na_fonte_em" timestamp with time zone,
	"documento_original_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contrato_numeroControlePncp_unique" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
ALTER TABLE "core"."contrato" ADD CONSTRAINT "contrato_fornecedor_id_organizacao_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "core"."organizacao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."contrato" ADD CONSTRAINT "contrato_documento_original_id_documento_original_id_fk" FOREIGN KEY ("documento_original_id") REFERENCES "raw"."documento_original"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contrato_fornecedor_cnpj_index" ON "core"."contrato" USING btree ("fornecedor_cnpj");--> statement-breakpoint
CREATE INDEX "contrato_fornecedor_id_index" ON "core"."contrato" USING btree ("fornecedor_id");--> statement-breakpoint
CREATE INDEX "contrato_orgao_cnpj_index" ON "core"."contrato" USING btree ("orgao_cnpj");