CREATE TABLE "ai_audit_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"paziente_id" varchar,
	"azione" varchar(30) NOT NULL,
	"provider" varchar(30) NOT NULL,
	"modello" varchar(60) NOT NULL,
	"byte_audio" integer,
	"esito" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consensi_ai" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"paziente_id" varchar NOT NULL,
	"versione_informativa" varchar(20) NOT NULL,
	"consenso_registrazione" boolean NOT NULL,
	"raccolto_da" varchar NOT NULL,
	"revocato_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_audit_log" ADD CONSTRAINT "ai_audit_log_paziente_id_pazienti_id_fk" FOREIGN KEY ("paziente_id") REFERENCES "public"."pazienti"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consensi_ai" ADD CONSTRAINT "consensi_ai_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consensi_ai" ADD CONSTRAINT "consensi_ai_paziente_id_pazienti_id_fk" FOREIGN KEY ("paziente_id") REFERENCES "public"."pazienti"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consensi_ai" ADD CONSTRAINT "consensi_ai_raccolto_da_users_id_fk" FOREIGN KEY ("raccolto_da") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_audit_ambulatorio_created_idx" ON "ai_audit_log" USING btree ("ambulatorio_id","created_at");--> statement-breakpoint
CREATE INDEX "consensi_ai_paziente_idx" ON "consensi_ai" USING btree ("paziente_id");