import { storage } from "./storage";
import { PLANS } from "@shared/features";

export async function seedDatabase() {
  try {
    const pazienti = await storage.getPazienti("temp");
    
    if (pazienti.length === 0) {
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
        features: PLANS.BASE.features,
        dataFine: trialEndDate,
      });

      console.log("✅ Database seeded successfully with ambulatorio:", ambulatorio.id);
      console.log("✅ Subscription trial creata (30 giorni) - Piano BASE");
    }
  } catch (error) {
    console.log("ℹ️  Seed skipped or already exists");
  }
}
