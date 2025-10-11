import { storage } from "./storage";

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

      console.log("✅ Database seeded successfully with ambulatorio:", ambulatorio.id);
    }
  } catch (error) {
    console.log("ℹ️  Seed skipped or already exists");
  }
}
