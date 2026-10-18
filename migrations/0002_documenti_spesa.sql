CREATE TABLE "documenti_spesa" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"emittente_id" varchar NOT NULL,
	"paziente_id" varchar NOT NULL,
	"visita_id" varchar,
	"anno" integer NOT NULL,
	"numero" integer NOT NULL,
	"tipo_documento" varchar(1) DEFAULT 'F' NOT NULL,
	"data_emissione" date NOT NULL,
	"data_pagamento" date NOT NULL,
	"metodo_pagamento" text NOT NULL,
	"voci" jsonb NOT NULL,
	"natura_iva" varchar(4) NOT NULL,
	"bollo" boolean NOT NULL,
	"flag_opposizione" boolean DEFAULT false NOT NULL,
	"cf_emittente" varchar(16) NOT NULL,
	"piva_emittente" varchar(11) NOT NULL,
	"cf_paziente" varchar(16) NOT NULL,
	"stato_ts" text DEFAULT 'da_inviare' NOT NULL,
	"protocollo_ts" varchar(20),
	"esito_ts" integer,
	"messaggi_ts" jsonb,
	"inviato_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "codice_fiscale" varchar(16);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partita_iva" varchar(11);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "regime_fiscale" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "natura_iva_default" varchar(4) DEFAULT 'N4';--> statement-breakpoint
ALTER TABLE "documenti_spesa" ADD CONSTRAINT "documenti_spesa_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_spesa" ADD CONSTRAINT "documenti_spesa_emittente_id_users_id_fk" FOREIGN KEY ("emittente_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_spesa" ADD CONSTRAINT "documenti_spesa_paziente_id_pazienti_id_fk" FOREIGN KEY ("paziente_id") REFERENCES "public"."pazienti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documenti_spesa" ADD CONSTRAINT "documenti_spesa_visita_id_visite_id_fk" FOREIGN KEY ("visita_id") REFERENCES "public"."visite"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "documenti_spesa_numero_unico" ON "documenti_spesa" USING btree ("emittente_id","anno","numero");--> statement-breakpoint
CREATE INDEX "documenti_spesa_ambulatorio_anno_idx" ON "documenti_spesa" USING btree ("ambulatorio_id","anno");--> statement-breakpoint
CREATE INDEX "documenti_spesa_paziente_idx" ON "documenti_spesa" USING btree ("paziente_id");