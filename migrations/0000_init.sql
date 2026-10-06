CREATE TYPE "public"."lead_status" AS ENUM('NUOVO', 'CONTATTATO', 'CONVERTITO', 'PERSO');--> statement-breakpoint
CREATE TYPE "public"."piano" AS ENUM('BASE', 'PROFESSIONAL', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" varchar NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"month" varchar(7) NOT NULL,
	"voice_notes_used" integer DEFAULT 0 NOT NULL,
	"auto_complete_used" integer DEFAULT 0 NOT NULL,
	"analytics_used" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ambulatori" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"indirizzo" text NOT NULL,
	"citta" text NOT NULL,
	"provincia" varchar(2) NOT NULL,
	"cap" varchar(5) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"email" text NOT NULL,
	"piva" varchar(11) NOT NULL,
	"regione" text NOT NULL,
	"specializzazione" text NOT NULL,
	"specialization_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appuntamenti" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paziente_id" varchar NOT NULL,
	"medico_id" varchar NOT NULL,
	"data_ora" timestamp NOT NULL,
	"durata" integer DEFAULT 30 NOT NULL,
	"tipo" text NOT NULL,
	"stato" text DEFAULT 'confermato' NOT NULL,
	"motivo_visita" text,
	"note" text,
	"ambulatorio_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"profile_completed" boolean DEFAULT false NOT NULL,
	"first_patient_added" boolean DEFAULT false NOT NULL,
	"first_appointment_added" boolean DEFAULT false NOT NULL,
	"theme_customized" boolean DEFAULT false NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "onboarding_progress_ambulatorio_id_unique" UNIQUE("ambulatorio_id")
);
--> statement-breakpoint
CREATE TABLE "pazienti" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"cognome" text NOT NULL,
	"codice_fiscale" varchar(16) NOT NULL,
	"data_nascita" timestamp NOT NULL,
	"luogo_nascita" text NOT NULL,
	"sesso" varchar(1) NOT NULL,
	"indirizzo" text NOT NULL,
	"citta" text NOT NULL,
	"provincia" varchar(2) NOT NULL,
	"cap" varchar(5) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"email" text,
	"note" text,
	"allergie" text[],
	"ambulatorio_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pazienti_codice_fiscale_unique" UNIQUE("codice_fiscale")
);
--> statement-breakpoint
CREATE TABLE "pricing_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"ambulatorio" text,
	"telefono" varchar(20),
	"piano" "piano" NOT NULL,
	"note" text,
	"status" "lead_status" DEFAULT 'NUOVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"slug" text NOT NULL,
	"descrizione" text,
	"default_kpis" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"cartella_template" text DEFAULT '{}' NOT NULL,
	"parametri_vitali" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"quick_actions" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_nome_unique" UNIQUE("nome"),
	CONSTRAINT "specializations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"piano" "piano" DEFAULT 'BASE' NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"prezzo_mensile" integer NOT NULL,
	"features" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"data_inizio" timestamp DEFAULT now() NOT NULL,
	"data_fine" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_ambulatorio_id_unique" UNIQUE("ambulatorio_id")
);
--> statement-breakpoint
CREATE TABLE "theme_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"primary_color" varchar(7) DEFAULT '#2563eb' NOT NULL,
	"primary_light" varchar(7) DEFAULT '#3b82f6' NOT NULL,
	"primary_dark" varchar(7) DEFAULT '#1e40af' NOT NULL,
	"accent_color" varchar(7) DEFAULT '#10b981' NOT NULL,
	"success_color" varchar(7) DEFAULT '#22c55e' NOT NULL,
	"warning_color" varchar(7) DEFAULT '#f59e0b' NOT NULL,
	"error_color" varchar(7) DEFAULT '#ef4444' NOT NULL,
	"source_type" varchar(20) DEFAULT 'default' NOT NULL,
	"source_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "theme_settings_ambulatorio_id_unique" UNIQUE("ambulatorio_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"dashboard_layout" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"table_settings" text DEFAULT '{}' NOT NULL,
	"notifications" text DEFAULT '{}' NOT NULL,
	"custom_shortcuts" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nome" text NOT NULL,
	"cognome" text NOT NULL,
	"ruolo" text DEFAULT 'medico' NOT NULL,
	"ambulatorio_id" varchar NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visite" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paziente_id" varchar NOT NULL,
	"medico_id" varchar NOT NULL,
	"appuntamento_id" varchar,
	"data_visita" timestamp NOT NULL,
	"motivo_visita" text NOT NULL,
	"anamnesi" text,
	"esame_obiettivo" text,
	"esami_eseguiti" text,
	"diagnosi" text NOT NULL,
	"terapia" text,
	"prescrizione_farmaci" text,
	"note_cliniche" text,
	"allegati" text[],
	"peso" integer,
	"altezza" integer,
	"pressione_sistolica" integer,
	"pressione_diastolica" integer,
	"frequenza_cardiaca" integer,
	"temperatura" integer,
	"ambulatorio_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambulatori" ADD CONSTRAINT "ambulatori_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_paziente_id_pazienti_id_fk" FOREIGN KEY ("paziente_id") REFERENCES "public"."pazienti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_medico_id_users_id_fk" FOREIGN KEY ("medico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appuntamenti" ADD CONSTRAINT "appuntamenti_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pazienti" ADD CONSTRAINT "pazienti_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_settings" ADD CONSTRAINT "theme_settings_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visite" ADD CONSTRAINT "visite_paziente_id_pazienti_id_fk" FOREIGN KEY ("paziente_id") REFERENCES "public"."pazienti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visite" ADD CONSTRAINT "visite_medico_id_users_id_fk" FOREIGN KEY ("medico_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visite" ADD CONSTRAINT "visite_appuntamento_id_appuntamenti_id_fk" FOREIGN KEY ("appuntamento_id") REFERENCES "public"."appuntamenti"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visite" ADD CONSTRAINT "visite_ambulatorio_id_ambulatori_id_fk" FOREIGN KEY ("ambulatorio_id") REFERENCES "public"."ambulatori"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ambulatorio_month_idx" ON "ai_usage" USING btree ("ambulatorio_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "user_month_unique_idx" ON "ai_usage" USING btree ("ambulatorio_id","user_id","month");--> statement-breakpoint
CREATE INDEX "data_ora_idx" ON "appuntamenti" USING btree ("data_ora");--> statement-breakpoint
CREATE INDEX "paziente_idx" ON "appuntamenti" USING btree ("paziente_id");--> statement-breakpoint
CREATE INDEX "medico_idx" ON "appuntamenti" USING btree ("medico_id");--> statement-breakpoint
CREATE INDEX "onboarding_ambulatorio_idx" ON "onboarding_progress" USING btree ("ambulatorio_id");--> statement-breakpoint
CREATE INDEX "cognome_nome_idx" ON "pazienti" USING btree ("cognome","nome");--> statement-breakpoint
CREATE INDEX "codice_fiscale_idx" ON "pazienti" USING btree ("codice_fiscale");--> statement-breakpoint
CREATE INDEX "piano_idx" ON "pricing_leads" USING btree ("piano");--> statement-breakpoint
CREATE INDEX "status_idx" ON "pricing_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "created_at_idx" ON "pricing_leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_idx" ON "pricing_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "specialization_slug_idx" ON "specializations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "theme_ambulatorio_idx" ON "theme_settings" USING btree ("ambulatorio_id");--> statement-breakpoint
CREATE INDEX "user_preferences_user_idx" ON "user_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "data_visita_idx" ON "visite" USING btree ("data_visita");--> statement-breakpoint
CREATE INDEX "paziente_visita_idx" ON "visite" USING btree ("paziente_id");--> statement-breakpoint
CREATE INDEX "medico_visita_idx" ON "visite" USING btree ("medico_id");