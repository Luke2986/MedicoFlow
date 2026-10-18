import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, uniqueIndex, pgEnum, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { validateCodiceFiscale } from "./validators";


export const specializations = pgTable("specializations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull().unique(),
  slug: text("slug").notNull().unique(),
  descrizione: text("descrizione"),
  defaultKPIs: text("default_kpis").array().notNull().default(sql`ARRAY[]::text[]`),
  cartellaTemplate: text("cartella_template").notNull().default('{}'),
  parametriVitali: text("parametri_vitali").array().notNull().default(sql`ARRAY[]::text[]`),
  quickActions: text("quick_actions").notNull().default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("specialization_slug_idx").on(table.slug),
}));

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  dashboardLayout: text("dashboard_layout").array().notNull().default(sql`ARRAY[]::text[]`),
  tableSettings: text("table_settings").notNull().default('{}'),
  notifications: text("notifications").notNull().default('{}'),
  customShortcuts: text("custom_shortcuts"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_preferences_user_idx").on(table.userId),
}));

export const ambulatori = pgTable("ambulatori", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  indirizzo: text("indirizzo").notNull(),
  citta: text("citta").notNull(),
  provincia: varchar("provincia", { length: 2 }).notNull(),
  cap: varchar("cap", { length: 5 }).notNull(),
  telefono: varchar("telefono", { length: 20 }).notNull(),
  email: text("email").notNull(),
  piva: varchar("piva", { length: 11 }).notNull(),
  regione: text("regione").notNull(),
  specializzazione: text("specializzazione").notNull(),
  specializationId: varchar("specialization_id").references(() => specializations.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  ruolo: text("ruolo").notNull().default("medico"),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // In the Sistema TS the "proprietario" of a fiscal document is the individual doctor, not the clinic.
  codiceFiscale: varchar("codice_fiscale", { length: 16 }),
  partitaIva: varchar("partita_iva", { length: 11 }),
  regimeFiscale: text("regime_fiscale"),
  naturaIvaDefault: varchar("natura_iva_default", { length: 4 }).default("N4"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const RUOLI = ["admin", "medico", "segreteria"] as const;
export type Ruolo = (typeof RUOLI)[number];

// Tables managed by Better Auth (sessions, password credentials, verification tokens).
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("session_user_idx").on(table.userId),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("account_user_idx").on(table.userId),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pazienti = pgTable("pazienti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  codiceFiscale: varchar("codice_fiscale", { length: 16 }).notNull().unique(),
  dataNascita: timestamp("data_nascita").notNull(),
  luogoNascita: text("luogo_nascita").notNull(),
  sesso: varchar("sesso", { length: 1 }).notNull(),
  indirizzo: text("indirizzo").notNull(),
  citta: text("citta").notNull(),
  provincia: varchar("provincia", { length: 2 }).notNull(),
  cap: varchar("cap", { length: 5 }).notNull(),
  telefono: varchar("telefono", { length: 20 }).notNull(),
  email: text("email"),
  note: text("note"),
  allergie: text("allergie").array(),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  cognomeNomeIdx: index("cognome_nome_idx").on(table.cognome, table.nome),
  codiceFiscaleIdx: index("codice_fiscale_idx").on(table.codiceFiscale),
}));

export const appuntamenti = pgTable("appuntamenti", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pazienteId: varchar("paziente_id").notNull().references(() => pazienti.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  dataOra: timestamp("data_ora").notNull(),
  durata: integer("durata").notNull().default(30),
  tipo: text("tipo").notNull(),
  stato: text("stato").notNull().default("confermato"),
  motivoVisita: text("motivo_visita"),
  note: text("note"),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dataOraIdx: index("data_ora_idx").on(table.dataOra),
  pazienteIdx: index("paziente_idx").on(table.pazienteId),
  medicoIdx: index("medico_idx").on(table.medicoId),
}));

export const visite = pgTable("visite", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pazienteId: varchar("paziente_id").notNull().references(() => pazienti.id),
  medicoId: varchar("medico_id").notNull().references(() => users.id),
  appuntamentoId: varchar("appuntamento_id").references(() => appuntamenti.id),
  dataVisita: timestamp("data_visita").notNull(),
  motivoVisita: text("motivo_visita").notNull(),
  anamnesi: text("anamnesi"),
  esameObiettivo: text("esame_obiettivo"),
  esamiEseguiti: text("esami_eseguiti"),
  diagnosi: text("diagnosi").notNull(),
  terapia: text("terapia"),
  prescrizioneFarmaci: text("prescrizione_farmaci"),
  noteCliniche: text("note_cliniche"),
  allegati: text("allegati").array(),
  peso: integer("peso"),
  altezza: integer("altezza"),
  pressioneSistolica: integer("pressione_sistolica"),
  pressioneDiastolica: integer("pressione_diastolica"),
  frequenzaCardiaca: integer("frequenza_cardiaca"),
  temperatura: integer("temperatura"),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  dataVisitaIdx: index("data_visita_idx").on(table.dataVisita),
  pazienteVisitaIdx: index("paziente_visita_idx").on(table.pazienteId),
  medicoVisitaIdx: index("medico_visita_idx").on(table.medicoId),
}));

export const onboardingProgress = pgTable("onboarding_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().unique().references(() => ambulatori.id),
  profileCompleted: boolean("profile_completed").notNull().default(false),
  firstPatientAdded: boolean("first_patient_added").notNull().default(false),
  firstAppointmentAdded: boolean("first_appointment_added").notNull().default(false),
  themeCustomized: boolean("theme_customized").notNull().default(false),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ambulatorioIdx: index("onboarding_ambulatorio_idx").on(table.ambulatorioId),
}));

export const ambulatoriRelations = relations(ambulatori, ({ many, one }) => ({
  users: many(users),
  pazienti: many(pazienti),
  appuntamenti: many(appuntamenti),
  visite: many(visite),
  onboardingProgress: one(onboardingProgress, {
    fields: [ambulatori.id],
    references: [onboardingProgress.ambulatorioId],
  }),
  specialization: one(specializations, {
    fields: [ambulatori.specializationId],
    references: [specializations.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  ambulatorio: one(ambulatori, {
    fields: [users.ambulatorioId],
    references: [ambulatori.id],
  }),
  appuntamenti: many(appuntamenti),
  visite: many(visite),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

export const pazientiRelations = relations(pazienti, ({ one, many }) => ({
  ambulatorio: one(ambulatori, {
    fields: [pazienti.ambulatorioId],
    references: [ambulatori.id],
  }),
  appuntamenti: many(appuntamenti),
  visite: many(visite),
}));

export const appuntamentiRelations = relations(appuntamenti, ({ one, many }) => ({
  paziente: one(pazienti, {
    fields: [appuntamenti.pazienteId],
    references: [pazienti.id],
  }),
  medico: one(users, {
    fields: [appuntamenti.medicoId],
    references: [users.id],
  }),
  ambulatorio: one(ambulatori, {
    fields: [appuntamenti.ambulatorioId],
    references: [ambulatori.id],
  }),
  visita: one(visite, {
    fields: [appuntamenti.id],
    references: [visite.appuntamentoId],
  }),
}));

export const visiteRelations = relations(visite, ({ one }) => ({
  paziente: one(pazienti, {
    fields: [visite.pazienteId],
    references: [pazienti.id],
  }),
  medico: one(users, {
    fields: [visite.medicoId],
    references: [users.id],
  }),
  appuntamento: one(appuntamenti, {
    fields: [visite.appuntamentoId],
    references: [appuntamenti.id],
  }),
  ambulatorio: one(ambulatori, {
    fields: [visite.ambulatorioId],
    references: [ambulatori.id],
  }),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one }) => ({
  ambulatorio: one(ambulatori, {
    fields: [onboardingProgress.ambulatorioId],
    references: [ambulatori.id],
  }),
}));

export const specializationsRelations = relations(specializations, ({ many }) => ({
  ambulatori: many(ambulatori),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const consensiAi = pgTable("consensi_ai", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  pazienteId: varchar("paziente_id").notNull().references(() => pazienti.id, { onDelete: "cascade" }),
  versioneInformativa: varchar("versione_informativa", { length: 20 }).notNull(),
  consensoRegistrazione: boolean("consenso_registrazione").notNull(),
  raccoltoDa: varchar("raccolto_da").notNull().references(() => users.id),
  revocatoAt: timestamp("revocato_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pazienteIdx: index("consensi_ai_paziente_idx").on(table.pazienteId),
}));

// Never stores audio or transcribed text: only who used the AI, on which patient, and the outcome.
export const aiAuditLog = pgTable("ai_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  pazienteId: varchar("paziente_id").references(() => pazienti.id, { onDelete: "set null" }),
  azione: varchar("azione", { length: 30 }).notNull(),
  provider: varchar("provider", { length: 30 }).notNull(),
  modello: varchar("modello", { length: 60 }).notNull(),
  byteAudio: integer("byte_audio"),
  esito: varchar("esito", { length: 30 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  ambulatorioCreatedIdx: index("ai_audit_ambulatorio_created_idx").on(table.ambulatorioId, table.createdAt),
}));

export interface VoceSpesa {
  tipoSpesa: string;
  flagTipoSpesa?: string;
  descrizione: string;
  importoCentesimi: number;
}

export interface MessaggioTs {
  codice: string;
  descrizione: string;
  tipo: string;
}

// Fiscal records are never cascaded away: deleting a patient or a doctor must not erase issued invoices.
export const documentiSpesa = pgTable("documenti_spesa", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  emittenteId: varchar("emittente_id").notNull().references(() => users.id),
  pazienteId: varchar("paziente_id").notNull().references(() => pazienti.id),
  visitaId: varchar("visita_id").references(() => visite.id, { onDelete: "set null" }),
  anno: integer("anno").notNull(),
  numero: integer("numero").notNull(),
  tipoDocumento: varchar("tipo_documento", { length: 1 }).notNull().default("F"),
  dataEmissione: date("data_emissione", { mode: "string" }).notNull(),
  dataPagamento: date("data_pagamento", { mode: "string" }).notNull(),
  metodoPagamento: text("metodo_pagamento").notNull(),
  voci: jsonb("voci").$type<VoceSpesa[]>().notNull(),
  naturaIva: varchar("natura_iva", { length: 4 }).notNull(),
  bollo: boolean("bollo").notNull(),
  flagOpposizione: boolean("flag_opposizione").notNull().default(false),
  // Snapshot at issue time, so later edits to the doctor or patient do not change an issued document.
  cfEmittente: varchar("cf_emittente", { length: 16 }).notNull(),
  pivaEmittente: varchar("piva_emittente", { length: 11 }).notNull(),
  cfPaziente: varchar("cf_paziente", { length: 16 }).notNull(),
  statoTs: text("stato_ts").notNull().default("da_inviare"),
  protocolloTs: varchar("protocollo_ts", { length: 20 }),
  esitoTs: integer("esito_ts"),
  messaggiTs: jsonb("messaggi_ts").$type<MessaggioTs[]>(),
  inviatoAt: timestamp("inviato_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  numeroUnico: uniqueIndex("documenti_spesa_numero_unico").on(table.emittenteId, table.anno, table.numero),
  ambulatorioAnnoIdx: index("documenti_spesa_ambulatorio_anno_idx").on(table.ambulatorioId, table.anno),
  pazienteIdx: index("documenti_spesa_paziente_idx").on(table.pazienteId),
}));

export type DocumentoSpesa = typeof documentiSpesa.$inferSelect;
export type InsertDocumentoSpesa = typeof documentiSpesa.$inferInsert;

export type ConsensoAi = typeof consensiAi.$inferSelect;
export type AiAuditEntry = typeof aiAuditLog.$inferSelect;
export type InsertAiAuditEntry = typeof aiAuditLog.$inferInsert;

export const insertAmbulatorioSchema = createInsertSchema(ambulatori).omit({
  id: true,
  createdAt: true,
});

export const updateAmbulatorioSchema = insertAmbulatorioSchema.partial();

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPazienteSchema = createInsertSchema(pazienti).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataNascita: z.string().transform((val) => new Date(val)),
  codiceFiscale: z.string()
    .length(16, 'Il Codice Fiscale deve essere di 16 caratteri')
    .refine(validateCodiceFiscale, {
      message: 'Codice Fiscale non valido (verificare carattere di controllo)'
    })
    .transform((val) => val.toUpperCase()),
  provincia: z.string()
    .length(2, 'Provincia deve essere 2 lettere (es. MI)')
    .regex(/^[A-Za-z]{2}$/, 'Provincia deve contenere solo lettere')
    .transform((val) => val.toUpperCase()),
  cap: z.string()
    .regex(/^\d{5}$/, 'CAP deve essere 5 cifre'),
  telefono: z.string()
    .regex(/^(\+39)?[\s]?[0-9]{9,10}$/, 'Telefono non valido (9-10 cifre)'),
});

export const updatePazienteSchema = insertPazienteSchema
  .omit({ codiceFiscale: true })
  .partial()
  .extend({
    codiceFiscale: z.string()
      .length(16, 'Il Codice Fiscale deve essere di 16 caratteri')
      .regex(/^[A-Z0-9]{16}$/, 'Codice Fiscale deve contenere solo lettere maiuscole e numeri')
      .transform((val) => val.toUpperCase())
      .optional(),
  });

export const insertAppuntamentoSchema = createInsertSchema(appuntamenti).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataOra: z.string().transform((val) => new Date(val)),
  medicoId: z.string().optional(),
});

export const updateAppuntamentoSchema = insertAppuntamentoSchema.partial();

export const insertVisitaSchema = createInsertSchema(visite).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataVisita: z.string().transform((val) => new Date(val)),
  medicoId: z.string().optional(),
  appuntamentoId: z.string().optional(),
});

export const updateVisitaSchema = insertVisitaSchema.partial();

export type Ambulatorio = typeof ambulatori.$inferSelect;
export type InsertAmbulatorio = z.infer<typeof insertAmbulatorioSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Paziente = typeof pazienti.$inferSelect;
export type InsertPaziente = z.infer<typeof insertPazienteSchema>;

export type Appuntamento = typeof appuntamenti.$inferSelect;
export type InsertAppuntamento = z.infer<typeof insertAppuntamentoSchema>;

export type Visita = typeof visite.$inferSelect;
export type InsertVisita = z.infer<typeof insertVisitaSchema>;

export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOnboardingProgressSchema = insertOnboardingProgressSchema.partial();

export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;

export const insertSpecializationSchema = createInsertSchema(specializations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSpecializationSchema = insertSpecializationSchema.partial();

export type Specialization = typeof specializations.$inferSelect;
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  theme: z.enum(["light", "dark", "auto"]),
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial();

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export const themeSettings = pgTable("theme_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().unique().references(() => ambulatori.id),
  
  primaryColor: varchar("primary_color", { length: 7 }).notNull().default("#2563eb"),
  primaryLight: varchar("primary_light", { length: 7 }).notNull().default("#3b82f6"),
  primaryDark: varchar("primary_dark", { length: 7 }).notNull().default("#1e40af"),
  accentColor: varchar("accent_color", { length: 7 }).notNull().default("#10b981"),
  successColor: varchar("success_color", { length: 7 }).notNull().default("#22c55e"),
  warningColor: varchar("warning_color", { length: 7 }).notNull().default("#f59e0b"),
  errorColor: varchar("error_color", { length: 7 }).notNull().default("#ef4444"),
  
  sourceType: varchar("source_type", { length: 20 }).notNull().default("default"),
  sourceUrl: text("source_url"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ambulatorioIdx: index("theme_ambulatorio_idx").on(table.ambulatorioId),
}));

export const insertThemeSettingsSchema = createInsertSchema(themeSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  primaryLight: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  primaryDark: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  successColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  warningColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  errorColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Deve essere un colore HEX valido (#RRGGBB)"),
  sourceType: z.enum(["default", "url", "custom"]),
});

export const updateThemeSettingsSchema = insertThemeSettingsSchema.partial();

export type ThemeSettings = typeof themeSettings.$inferSelect;
export type InsertThemeSettings = z.infer<typeof insertThemeSettingsSchema>;
