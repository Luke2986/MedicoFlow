import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { validateCodiceFiscale } from "./validators";

export const pianoEnum = pgEnum("piano", ["BASE", "PROFESSIONAL", "ENTERPRISE"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["ACTIVE", "CANCELLED", "EXPIRED", "TRIAL"]);

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull(),
  cognome: text("cognome").notNull(),
  ruolo: text("ruolo").notNull().default("medico"),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
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

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().unique().references(() => ambulatori.id),
  piano: pianoEnum("piano").notNull().default("BASE"),
  status: subscriptionStatusEnum("status").notNull().default("ACTIVE"),
  prezzoMensile: integer("prezzo_mensile").notNull(),
  features: text("features").array().notNull().default(sql`ARRAY[]::text[]`),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  dataInizio: timestamp("data_inizio").defaultNow().notNull(),
  dataFine: timestamp("data_fine"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ambulatoriRelations = relations(ambulatori, ({ many, one }) => ({
  users: many(users),
  pazienti: many(pazienti),
  appuntamenti: many(appuntamenti),
  visite: many(visite),
  subscription: one(subscriptions, {
    fields: [ambulatori.id],
    references: [subscriptions.ambulatorioId],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  ambulatorio: one(ambulatori, {
    fields: [users.ambulatorioId],
    references: [ambulatori.id],
  }),
  appuntamenti: many(appuntamenti),
  visite: many(visite),
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

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  ambulatorio: one(ambulatori, {
    fields: [subscriptions.ambulatorioId],
    references: [ambulatori.id],
  }),
}));

export const aiUsage = pgTable("ai_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ambulatorioId: varchar("ambulatorio_id").notNull().references(() => ambulatori.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: varchar("month", { length: 7 }).notNull(), // formato: "2025-01"
  voiceNotesUsed: integer("voice_notes_used").notNull().default(0),
  autoCompleteUsed: integer("auto_complete_used").notNull().default(0),
  analyticsUsed: integer("analytics_used").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ambulatorioMonthIdx: index("ambulatorio_month_idx").on(table.ambulatorioId, table.month),
  userMonthUnique: uniqueIndex("user_month_unique_idx").on(table.ambulatorioId, table.userId, table.month),
}));

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  ambulatorio: one(ambulatori, {
    fields: [aiUsage.ambulatorioId],
    references: [ambulatori.id],
  }),
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

export const leadStatusEnum = pgEnum("lead_status", ["NUOVO", "CONTATTATO", "CONVERTITO", "PERSO"]);

export const pricingLeads = pgTable("pricing_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  nome: text("nome").notNull(),
  ambulatorio: text("ambulatorio"),
  telefono: varchar("telefono", { length: 20 }),
  piano: pianoEnum("piano").notNull(),
  note: text("note"),
  status: leadStatusEnum("status").notNull().default("NUOVO"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pianoIdx: index("piano_idx").on(table.piano),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
  emailIdx: index("email_idx").on(table.email),
}));

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

export const updatePazienteSchema = insertPazienteSchema.partial();

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

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateSubscriptionSchema = insertSubscriptionSchema.partial();

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export const insertAIUsageSchema = createInsertSchema(aiUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AIUsage = typeof aiUsage.$inferSelect;
export type InsertAIUsage = z.infer<typeof insertAIUsageSchema>;

export const insertPricingLeadSchema = createInsertSchema(pricingLeads).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const updatePricingLeadSchema = insertPricingLeadSchema.partial().extend({
  status: z.enum(["NUOVO", "CONTATTATO", "CONVERTITO", "PERSO"]).optional(),
});

export type PricingLead = typeof pricingLeads.$inferSelect;
export type InsertPricingLead = z.infer<typeof insertPricingLeadSchema>;
