import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertAmbulatorioSchema,
  insertUserSchema,
  insertPazienteSchema,
  updatePazienteSchema,
  insertAppuntamentoSchema,
  updateAppuntamentoSchema,
} from "@shared/schema";

const statsQuerySchema = z.object({
  ambulatorioId: z.string().uuid("ambulatorioId deve essere un UUID valido"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/ambulatori-list", async (req, res) => {
    try {
      const result = await storage.getAllAmbulatori();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/ambulatori/:id", async (req, res) => {
    try {
      const ambulatorio = await storage.getAmbulatorio(req.params.id);
      if (!ambulatorio) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }
      res.json(ambulatorio);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/ambulatori", async (req, res) => {
    try {
      const data = insertAmbulatorioSchema.parse(req.body);
      const ambulatorio = await storage.createAmbulatorio(data);
      res.status(201).json(ambulatorio);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/users/email/:email", async (req, res) => {
    try {
      const user = await storage.getUserByEmail(req.params.email);
      if (!user) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.get("/api/pazienti", async (req, res) => {
    try {
      const { ambulatorioId, search } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      let pazienti;
      if (search && typeof search === 'string') {
        pazienti = await storage.searchPazienti(ambulatorioId, search);
      } else {
        pazienti = await storage.getPazienti(ambulatorioId);
      }
      
      res.json(pazienti);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/pazienti/:id", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!paziente) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      res.json(paziente);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/pazienti/codice-fiscale/:cf", async (req, res) => {
    try {
      const paziente = await storage.getPazienteByCodiceFiscale(req.params.cf);
      if (!paziente) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      res.json(paziente);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/pazienti", async (req, res) => {
    try {
      const data = insertPazienteSchema.parse(req.body);
      const paziente = await storage.createPaziente(data);
      res.status(201).json(paziente);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(409).json({ error: "Codice fiscale già esistente" });
      }
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/pazienti/:id", async (req, res) => {
    try {
      const data = updatePazienteSchema.parse(req.body);
      const paziente = await storage.updatePaziente(req.params.id, data);
      res.json(paziente);
    } catch (error: any) {
      console.error("Errore update paziente:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/pazienti/:id", async (req, res) => {
    try {
      await storage.deletePaziente(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  });

  app.get("/api/appuntamenti", async (req, res) => {
    try {
      const { ambulatorioId, pazienteId, medicoId, date } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      let appuntamenti;
      
      if (pazienteId && typeof pazienteId === 'string') {
        appuntamenti = await storage.getAppuntamentiByPaziente(pazienteId);
      } else if (medicoId && typeof medicoId === 'string') {
        appuntamenti = await storage.getAppuntamentiByMedico(medicoId);
      } else if (date && typeof date === 'string') {
        appuntamenti = await storage.getAppuntamentiByDate(ambulatorioId, new Date(date));
      } else {
        appuntamenti = await storage.getAppuntamenti(ambulatorioId);
      }
      
      res.json(appuntamenti);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/appuntamenti/:id", async (req, res) => {
    try {
      const appuntamento = await storage.getAppuntamento(req.params.id);
      if (!appuntamento) {
        return res.status(404).json({ error: "Appuntamento non trovato" });
      }
      res.json(appuntamento);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/appuntamenti", async (req, res) => {
    try {
      const data = insertAppuntamentoSchema.parse(req.body);
      
      if (!data.medicoId && data.ambulatorioId) {
        const medici = await storage.getUsersByAmbulatorio(data.ambulatorioId);
        if (medici.length > 0) {
          data.medicoId = medici[0].id;
        } else {
          return res.status(400).json({ error: "Nessun medico disponibile per questo ambulatorio" });
        }
      }
      
      const appuntamento = await storage.createAppuntamento(data);
      res.status(201).json(appuntamento);
    } catch (error) {
      console.error("Errore creazione appuntamento:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/appuntamenti/:id", async (req, res) => {
    try {
      const data = updateAppuntamentoSchema.parse(req.body);
      const appuntamento = await storage.updateAppuntamento(req.params.id, data);
      res.json(appuntamento);
    } catch (error: any) {
      console.error("Errore update appuntamento:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/appuntamenti/:id", async (req, res) => {
    try {
      await storage.deleteAppuntamento(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const validation = statsQuerySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Parametri non validi", 
          details: validation.error.issues 
        });
      }

      const { ambulatorioId } = validation.data;
      const today = new Date();
      
      const [pazienti, appuntamentiOggi, appuntamentiTotali] = await Promise.all([
        storage.getPazienti(ambulatorioId),
        storage.getAppuntamentiByDate(ambulatorioId, today),
        storage.getAppuntamenti(ambulatorioId),
      ]);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const appuntamentiSettimana = appuntamentiTotali.filter(app => 
        new Date(app.dataOra) >= startOfWeek
      );

      res.json({
        totalePazienti: pazienti.length,
        appuntamentiOggi: appuntamentiOggi.length,
        appuntamentiSettimana: appuntamentiSettimana.length,
        tassoAttivita: appuntamentiTotali.length > 0 
          ? Math.round((appuntamentiSettimana.length / 7) * 100) 
          : 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
