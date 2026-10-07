CREATE SCHEMA "restrito";
--> statement-breakpoint
CREATE TABLE "restrito"."documento_pessoa" (
	"pessoa_id" uuid PRIMARY KEY NOT NULL,
	"cpf_cifrado" text NOT NULL,
	"cpf_mascarado" text NOT NULL,
	"fonte" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "restrito"."documento_pessoa" ADD CONSTRAINT "documento_pessoa_pessoa_id_pessoa_id_fk" FOREIGN KEY ("pessoa_id") REFERENCES "core"."pessoa"("id") ON DELETE cascade ON UPDATE no action;