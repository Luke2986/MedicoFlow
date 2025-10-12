// Reference: javascript_database blueprint integration
import { 
  ambulatori, 
  users, 
  pazienti, 
  appuntamenti,
  visite,
  subscriptions,
  type Ambulatorio, 
  type InsertAmbulatorio,
  type User, 
  type InsertUser,
  type Paziente,
  type InsertPaziente,
  type Appuntamento,
  type InsertAppuntamento,
  type Visita,
  type InsertVisita,
  type Subscription,
  type InsertSubscription,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  getAllAmbulatori(): Promise<Ambulatorio[]>;
  getAmbulatorio(id: string): Promise<Ambulatorio | undefined>;
  createAmbulatorio(ambulatorio: InsertAmbulatorio): Promise<Ambulatorio>;
  updateAmbulatorio(id: string, ambulatorio: Partial<InsertAmbulatorio>): Promise<Ambulatorio>;
  
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsersByAmbulatorio(ambulatorioId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  getPazienti(ambulatorioId: string): Promise<Paziente[]>;
  getPaziente(id: string): Promise<Paziente | undefined>;
  getPazienteByCodiceFiscale(codiceFiscale: string): Promise<Paziente | undefined>;
  searchPazienti(ambulatorioId: string, query: string): Promise<Paziente[]>;
  searchPazientiAdvanced(ambulatorioId: string, filters: {
    query?: string;
    sesso?: string;
    citta?: string;
    provincia?: string;
    etaMin?: number;
    etaMax?: number;
  }): Promise<Paziente[]>;
  createPaziente(paziente: InsertPaziente): Promise<Paziente>;
  updatePaziente(id: string, paziente: Partial<InsertPaziente>): Promise<Paziente>;
  deletePaziente(id: string): Promise<void>;
  
  getAppuntamenti(ambulatorioId: string): Promise<Appuntamento[]>;
  getAppuntamento(id: string): Promise<Appuntamento | undefined>;
  getAppuntamentiByPaziente(pazienteId: string): Promise<Appuntamento[]>;
  getAppuntamentiByMedico(medicoId: string): Promise<Appuntamento[]>;
  getAppuntamentiByDate(ambulatorioId: string, date: Date): Promise<Appuntamento[]>;
  getAppuntamentiByWeek(ambulatorioId: string, weekStart: Date, weekEnd: Date): Promise<Appuntamento[]>;
  createAppuntamento(appuntamento: InsertAppuntamento): Promise<Appuntamento>;
  updateAppuntamento(id: string, appuntamento: Partial<InsertAppuntamento>): Promise<Appuntamento>;
  deleteAppuntamento(id: string): Promise<void>;
  
  getVisite(ambulatorioId: string): Promise<Visita[]>;
  getVisita(id: string): Promise<Visita | undefined>;
  getVisiteByPaziente(pazienteId: string): Promise<Visita[]>;
  getVisiteByMedico(medicoId: string): Promise<Visita[]>;
  createVisita(visita: InsertVisita): Promise<Visita>;
  updateVisita(id: string, visita: Partial<InsertVisita>): Promise<Visita>;
  deleteVisita(id: string): Promise<void>;
  
  getSubscription(ambulatorioId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(ambulatorioId: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;
}

export class DatabaseStorage implements IStorage {
  async getAllAmbulatori(): Promise<Ambulatorio[]> {
    return await db.select().from(ambulatori);
  }

  async getAmbulatorio(id: string): Promise<Ambulatorio | undefined> {
    const [ambulatorio] = await db.select().from(ambulatori).where(eq(ambulatori.id, id));
    return ambulatorio || undefined;
  }

  async createAmbulatorio(insertAmbulatorio: InsertAmbulatorio): Promise<Ambulatorio> {
    const [ambulatorio] = await db
      .insert(ambulatori)
      .values(insertAmbulatorio)
      .returning();
    return ambulatorio;
  }

  async updateAmbulatorio(id: string, ambulatorioData: Partial<InsertAmbulatorio>): Promise<Ambulatorio> {
    const [updated] = await db
      .update(ambulatori)
      .set(ambulatorioData)
      .where(eq(ambulatori.id, id))
      .returning();
    if (!updated) throw new Error("Ambulatorio non trovato");
    return updated;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUsersByAmbulatorio(ambulatorioId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.ambulatorioId, ambulatorioId));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getPazienti(ambulatorioId: string): Promise<Paziente[]> {
    return await db
      .select()
      .from(pazienti)
      .where(eq(pazienti.ambulatorioId, ambulatorioId))
      .orderBy(desc(pazienti.createdAt));
  }

  async getPaziente(id: string): Promise<Paziente | undefined> {
    const [paziente] = await db.select().from(pazienti).where(eq(pazienti.id, id));
    return paziente || undefined;
  }

  async getPazienteByCodiceFiscale(codiceFiscale: string): Promise<Paziente | undefined> {
    const [paziente] = await db
      .select()
      .from(pazienti)
      .where(eq(pazienti.codiceFiscale, codiceFiscale));
    return paziente || undefined;
  }

  async searchPazienti(ambulatorioId: string, query: string): Promise<Paziente[]> {
    const searchPattern = `%${query.toLowerCase()}%`;
    return await db
      .select()
      .from(pazienti)
      .where(
        and(
          eq(pazienti.ambulatorioId, ambulatorioId),
          or(
            sql`LOWER(${pazienti.nome}) LIKE ${searchPattern}`,
            sql`LOWER(${pazienti.cognome}) LIKE ${searchPattern}`,
            sql`LOWER(${pazienti.codiceFiscale}) LIKE ${searchPattern}`
          )
        )
      )
      .orderBy(pazienti.cognome, pazienti.nome);
  }

  async searchPazientiAdvanced(
    ambulatorioId: string, 
    filters: {
      query?: string;
      sesso?: string;
      citta?: string;
      provincia?: string;
      etaMin?: number;
      etaMax?: number;
    }
  ): Promise<Paziente[]> {
    const conditions = [eq(pazienti.ambulatorioId, ambulatorioId)];

    // Text search su nome, cognome, codice fiscale
    if (filters.query && filters.query.trim()) {
      const searchPattern = `%${filters.query.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${pazienti.nome}) LIKE ${searchPattern}`,
          sql`LOWER(${pazienti.cognome}) LIKE ${searchPattern}`,
          sql`LOWER(${pazienti.codiceFiscale}) LIKE ${searchPattern}`
        )!
      );
    }

    // Filtro sesso
    if (filters.sesso) {
      conditions.push(eq(pazienti.sesso, filters.sesso));
    }

    // Filtro città
    if (filters.citta) {
      conditions.push(sql`LOWER(${pazienti.citta}) = ${filters.citta.toLowerCase()}`);
    }

    // Filtro provincia
    if (filters.provincia) {
      conditions.push(eq(pazienti.provincia, filters.provincia.toUpperCase()));
    }

    // Filtro età usando SQL date arithmetic (timezone-safe)
    if (filters.etaMin !== undefined) {
      // Per età minima: paziente deve essere nato <= (CURRENT_DATE - etaMin anni)
      // Esempio: etaMin=24 → nati prima o uguale a 24 anni fa → 24+ anni
      conditions.push(sql`${pazienti.dataNascita} <= (CURRENT_DATE - INTERVAL '${sql.raw(filters.etaMin.toString())} years')`);
    }

    if (filters.etaMax !== undefined) {
      // Per età massima: paziente deve essere nato > (CURRENT_DATE - (etaMax + 1) anni)
      // Esempio: etaMax=45 → nati dopo 46 anni fa → 0-45 anni (incluso chi ha compiuto 45 anni)
      conditions.push(sql`${pazienti.dataNascita} > (CURRENT_DATE - INTERVAL '${sql.raw((filters.etaMax + 1).toString())} years')`);
    }

    return await db
      .select()
      .from(pazienti)
      .where(and(...conditions))
      .orderBy(pazienti.cognome, pazienti.nome);
  }

  async createPaziente(insertPaziente: InsertPaziente): Promise<Paziente> {
    const [paziente] = await db
      .insert(pazienti)
      .values(insertPaziente)
      .returning();
    return paziente;
  }

  async updatePaziente(id: string, updateData: Partial<InsertPaziente>): Promise<Paziente> {
    const [paziente] = await db
      .update(pazienti)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(pazienti.id, id))
      .returning();
    return paziente;
  }

  async deletePaziente(id: string): Promise<void> {
    await db.delete(pazienti).where(eq(pazienti.id, id));
  }

  async getAppuntamenti(ambulatorioId: string): Promise<Appuntamento[]> {
    const results = await db
      .select()
      .from(appuntamenti)
      .innerJoin(pazienti, eq(appuntamenti.pazienteId, pazienti.id))
      .where(eq(appuntamenti.ambulatorioId, ambulatorioId))
      .orderBy(desc(appuntamenti.dataOra));
    
    return results.map(r => ({ ...r.appuntamenti, paziente: r.pazienti }));
  }

  async getAppuntamento(id: string): Promise<Appuntamento | undefined> {
    const [appuntamento] = await db.select().from(appuntamenti).where(eq(appuntamenti.id, id));
    return appuntamento || undefined;
  }

  async getAppuntamentiByPaziente(pazienteId: string): Promise<Appuntamento[]> {
    const results = await db
      .select()
      .from(appuntamenti)
      .innerJoin(pazienti, eq(appuntamenti.pazienteId, pazienti.id))
      .where(eq(appuntamenti.pazienteId, pazienteId))
      .orderBy(desc(appuntamenti.dataOra));
    
    return results.map(r => ({ ...r.appuntamenti, paziente: r.pazienti }));
  }

  async getAppuntamentiByMedico(medicoId: string): Promise<Appuntamento[]> {
    const results = await db
      .select()
      .from(appuntamenti)
      .innerJoin(pazienti, eq(appuntamenti.pazienteId, pazienti.id))
      .where(eq(appuntamenti.medicoId, medicoId))
      .orderBy(desc(appuntamenti.dataOra));
    
    return results.map(r => ({ ...r.appuntamenti, paziente: r.pazienti }));
  }

  async getAppuntamentiByDate(ambulatorioId: string, date: Date): Promise<Appuntamento[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const results = await db
      .select()
      .from(appuntamenti)
      .innerJoin(pazienti, eq(appuntamenti.pazienteId, pazienti.id))
      .where(
        and(
          eq(appuntamenti.ambulatorioId, ambulatorioId),
          sql`${appuntamenti.dataOra} >= ${startOfDay}`,
          sql`${appuntamenti.dataOra} <= ${endOfDay}`
        )
      )
      .orderBy(appuntamenti.dataOra);
    
    return results.map(r => ({ ...r.appuntamenti, paziente: r.pazienti }));
  }

  async getAppuntamentiByWeek(ambulatorioId: string, weekStart: Date, weekEnd: Date): Promise<Appuntamento[]> {
    const results = await db
      .select()
      .from(appuntamenti)
      .innerJoin(pazienti, eq(appuntamenti.pazienteId, pazienti.id))
      .where(
        and(
          eq(appuntamenti.ambulatorioId, ambulatorioId),
          sql`${appuntamenti.dataOra} >= ${weekStart}`,
          sql`${appuntamenti.dataOra} <= ${weekEnd}`
        )
      )
      .orderBy(appuntamenti.dataOra);
    
    return results.map(r => ({ ...r.appuntamenti, paziente: r.pazienti }));
  }

  async createAppuntamento(insertAppuntamento: InsertAppuntamento): Promise<Appuntamento> {
    const [appuntamento] = await db
      .insert(appuntamenti)
      .values(insertAppuntamento)
      .returning();
    return appuntamento;
  }

  async updateAppuntamento(id: string, updateData: Partial<InsertAppuntamento>): Promise<Appuntamento> {
    const [appuntamento] = await db
      .update(appuntamenti)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(appuntamenti.id, id))
      .returning();
    return appuntamento;
  }

  async deleteAppuntamento(id: string): Promise<void> {
    await db.delete(appuntamenti).where(eq(appuntamenti.id, id));
  }

  async getVisite(ambulatorioId: string): Promise<Visita[]> {
    return await db
      .select()
      .from(visite)
      .where(eq(visite.ambulatorioId, ambulatorioId))
      .orderBy(desc(visite.dataVisita));
  }

  async getVisita(id: string): Promise<Visita | undefined> {
    const [visita] = await db.select().from(visite).where(eq(visite.id, id));
    return visita || undefined;
  }

  async getVisiteByPaziente(pazienteId: string): Promise<Visita[]> {
    return await db
      .select()
      .from(visite)
      .where(eq(visite.pazienteId, pazienteId))
      .orderBy(desc(visite.dataVisita));
  }

  async getVisiteByMedico(medicoId: string): Promise<Visita[]> {
    return await db
      .select()
      .from(visite)
      .where(eq(visite.medicoId, medicoId))
      .orderBy(desc(visite.dataVisita));
  }

  async createVisita(insertVisita: InsertVisita): Promise<Visita> {
    const [visita] = await db
      .insert(visite)
      .values(insertVisita)
      .returning();
    return visita;
  }

  async updateVisita(id: string, updateData: Partial<InsertVisita>): Promise<Visita> {
    const [visita] = await db
      .update(visite)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(visite.id, id))
      .returning();
    return visita;
  }

  async deleteVisita(id: string): Promise<void> {
    await db.delete(visite).where(eq(visite.id, id));
  }

  async getSubscription(ambulatorioId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.ambulatorioId, ambulatorioId));
    return subscription || undefined;
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async updateSubscription(ambulatorioId: string, updateData: Partial<InsertSubscription>): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(subscriptions.ambulatorioId, ambulatorioId))
      .returning();
    return subscription;
  }
}

export const storage = new DatabaseStorage();
