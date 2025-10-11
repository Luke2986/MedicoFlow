import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const ambulatoriRelations = relations(ambulatori, ({ many }) => ({
  users: many(users),
  pazienti: many(pazienti),
  appuntamenti: many(appuntamenti),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  ambulatorio: one(ambulatori, {
    fields: [users.ambulatorioId],
    references: [ambulatori.id],
  }),
  appuntamenti: many(appuntamenti),
}));

export const pazientiRelations = relations(pazienti, ({ one, many }) => ({
  ambulatorio: one(ambulatori, {
    fields: [pazienti.ambulatorioId],
    references: [ambulatori.id],
  }),
  appuntamenti: many(appuntamenti),
}));

export const appuntamentiRelations = relations(appuntamenti, ({ one }) => ({
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
}));

export const insertAmbulatorioSchema = createInsertSchema(ambulatori).omit({
  id: true,
  createdAt: true,
});

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

export type Ambulatorio = typeof ambulatori.$inferSelect;
export type InsertAmbulatorio = z.infer<typeof insertAmbulatorioSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Paziente = typeof pazienti.$inferSelect;
export type InsertPaziente = z.infer<typeof insertPazienteSchema>;

export type Appuntamento = typeof appuntamenti.$inferSelect;
export type InsertAppuntamento = z.infer<typeof insertAppuntamentoSchema>;
