import { storage } from "./storage";
import { PLANS } from "@shared/features";
import { db } from "./db";
import { ambulatori } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if any ambulatori exist (not just pazienti)
    const existingAmbulatori = await storage.getAllAmbulatori();
    
    if (existingAmbulatori.length === 0) {
      // Create default ambulatorio with fixed ID for fallback (direct DB insert to specify ID)
      await db.insert(ambulatori).values({
        id: "default-ambulatorio-id",
        nome: "Ambulatorio Demo",
        indirizzo: "Via Demo 1",
        citta: "Milano",
        provincia: "MI",
        cap: "20100",
        telefono: "+39 02 0000000",
        email: "demo@medicoflow.it",
        piva: "00000000000",
        regione: "Lombardia",
        specializzazione: "Medicina Generale",
      });

      // Create trial subscription for default ambulatorio
      const defaultTrialEnd = new Date();
      defaultTrialEnd.setDate(defaultTrialEnd.getDate() + 30);
      
      await storage.createSubscription({
        ambulatorioId: "default-ambulatorio-id",
        piano: "BASE",
        status: "TRIAL",
        prezzoMensile: PLANS.BASE.price * 100,
        features: [...PLANS.BASE.features],
        dataFine: defaultTrialEnd,
      });

      console.log("✅ Default ambulatorio created with ID: default-ambulatorio-id");

      // Create main demo ambulatorio
      const ambulatorio = await storage.createAmbulatorio({
        nome: "Ambulatorio Dr. Mario Rossi",
        indirizzo: "Via Roma 123",
        citta: "Milano",
        provincia: "MI",
        cap: "20100",
        telefono: "+39 02 1234567",
        email: "info@ambulatoriorossi.it",
        piva: "12345678901",
        regione: "Lombardia",
        specializzazione: "Medicina Generale",
      });

      await storage.createUser({
        email: "mario.rossi@ambulatoriorossi.it",
        nome: "Mario",
        cognome: "Rossi",
        ruolo: "medico",
        ambulatorioId: ambulatorio.id,
      });

      // Crea subscription trial 30 giorni - Piano BASE
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);

      await storage.createSubscription({
        ambulatorioId: ambulatorio.id,
        piano: "BASE",
        status: "TRIAL",
        prezzoMensile: PLANS.BASE.price * 100,
        features: [...PLANS.BASE.features],
        dataFine: trialEndDate,
      });

      console.log("✅ Database seeded successfully with ambulatorio:", ambulatorio.id);
      console.log("✅ Subscription trial creata (30 giorni) - Piano BASE");
    } else {
      console.log("ℹ️  Seed skipped - ambulatori already exist");
    }
  } catch (error) {
    console.log("ℹ️  Seed error or already exists:", error);
  }
}
