CREATE TABLE "core"."contratacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"numero_controle_pncp" text NOT NULL,
	"orgao_id" uuid NOT NULL,
	"ente_id" uuid NOT NULL,
	"unidade_codigo" text,
	"unidade_nome" text,
	"ano" integer NOT NULL,
	"sequencial" integer NOT NULL,
	"numero" text,
	"processo" text,
	"objeto" text,
	"informacao_complementar" text,
	"modalidade_id" integer NOT NULL,
	"modalidade_nome" text,
	"modo_disputa_id" integer,
	"modo_disputa_nome" text,
	"amparo_legal_codigo" integer,
	"amparo_legal_nome" text,
	"situacao_id" integer NOT NULL,
	"situacao_nome" text,
	"registro_de_precos" boolean,
	"valor_estimado" numeric(18, 2),
	"valor_homologado" numeric(18, 2),
	"abertura_propostas_em" timestamp with time zone,
	"encerramento_propostas_em" timestamp with time zone,
	"publicada_em" timestamp with time zone NOT NULL,
	"atualizada_na_fonte_em" timestamp with time zone,
	"link_sistema_origem" text,
	"documento_original_id" uuid,
	"busca" "tsvector" GENERATED ALWAYS AS (to_tsvector('public.portuguese_unaccent', coalesce(objeto, '') || ' ' || coalesce(numero, '') || ' ' || coalesce(processo, ''))) STORED,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contratacao_numeroControlePncp_unique" UNIQUE("numero_controle_pncp")
);
--> statement-breakpoint
DROP INDEX "core"."orgao_organizacao_id_index";--> statement-breakpoint
ALTER TABLE "core"."contratacao" ADD CONSTRAINT "contratacao_orgao_id_orgao_id_fk" FOREIGN KEY ("orgao_id") REFERENCES "core"."orgao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."contratacao" ADD CONSTRAINT "contratacao_ente_id_ente_federativo_id_fk" FOREIGN KEY ("ente_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."contratacao" ADD CONSTRAINT "contratacao_documento_original_id_documento_original_id_fk" FOREIGN KEY ("documento_original_id") REFERENCES "raw"."documento_original"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contratacao_orgao_id_index" ON "core"."contratacao" USING btree ("orgao_id");--> statement-breakpoint
CREATE INDEX "contratacao_ente_id_publicada_em_index" ON "core"."contratacao" USING btree ("ente_id","publicada_em");--> statement-breakpoint
CREATE INDEX "contratacao_modalidade_id_publicada_em_index" ON "core"."contratacao" USING btree ("modalidade_id","publicada_em");--> statement-breakpoint
CREATE INDEX "contratacao_encerramento_propostas_em_index" ON "core"."contratacao" USING btree ("encerramento_propostas_em");--> statement-breakpoint
CREATE INDEX "contratacao_busca" ON "core"."contratacao" USING gin ("busca");--> statement-breakpoint
ALTER TABLE "core"."orgao" ADD CONSTRAINT "orgao_organizacao_unica" UNIQUE("organizacao_id");