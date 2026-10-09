CREATE TABLE "core"."emenda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ente_id" uuid NOT NULL,
	"ano" integer NOT NULL,
	"codigo" text NOT NULL,
	"numero" text,
	"tipo" text NOT NULL,
	"autor_nome" text NOT NULL,
	"pessoa_id" uuid,
	"valor" numeric(18, 2) NOT NULL,
	"unidade_orcamentaria" text,
	"acao" text,
	"funcao" text,
	"subfuncao" text,
	"objeto" text,
	"justificativa" text,
	"beneficiario" text,
	"municipio" text,
	"beneficiario_cnpj" text,
	"modalidade" text,
	"processo_sei" text,
	"empenhado" numeric(18, 2),
	"liquidado" numeric(18, 2),
	"pago" numeric(18, 2),
	"posicao_execucao" text,
	"fonte_url" text NOT NULL,
	"documento_original_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emenda_unica" UNIQUE("ente_id","ano","codigo")
);
--> statement-breakpoint
CREATE TABLE "core"."emenda_empenho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emenda_id" uuid NOT NULL,
	"numero_empenho" text NOT NULL,
	"descricao" text,
	"empenhado" numeric(18, 2) NOT NULL,
	"liquidado" numeric(18, 2) NOT NULL,
	"pago" numeric(18, 2) NOT NULL,
	"posicao" text,
	"documento_original_id" uuid,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "emenda_empenho_unico" UNIQUE("emenda_id","numero_empenho")
);
--> statement-breakpoint
ALTER TABLE "core"."emenda" ADD CONSTRAINT "emenda_ente_id_ente_federativo_id_fk" FOREIGN KEY ("ente_id") REFERENCES "core"."ente_federativo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."emenda" ADD CONSTRAINT "emenda_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."emenda" ADD CONSTRAINT "emenda_documento_original_id_documento_original_id_fk" FOREIGN KEY ("documento_original_id") REFERENCES "raw"."documento_original"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."emenda_empenho" ADD CONSTRAINT "emenda_empenho_emenda_id_emenda_id_fk" FOREIGN KEY ("emenda_id") REFERENCES "core"."emenda"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."emenda_empenho" ADD CONSTRAINT "emenda_empenho_documento_original_id_documento_original_id_fk" FOREIGN KEY ("documento_original_id") REFERENCES "raw"."documento_original"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emenda_pessoa_id_index" ON "core"."emenda" USING btree ("pessoa_id");--> statement-breakpoint
CREATE INDEX "emenda_beneficiario_cnpj_index" ON "core"."emenda" USING btree ("beneficiario_cnpj");