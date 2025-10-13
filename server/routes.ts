import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { startOfWeek, endOfWeek } from "date-fns";
import { 
  insertAmbulatorioSchema,
  updateAmbulatorioSchema,
  insertUserSchema,
  insertPazienteSchema,
  updatePazienteSchema,
  insertAppuntamentoSchema,
  updateAppuntamentoSchema,
  insertVisitaSchema,
  updateVisitaSchema,
  updateSubscriptionSchema,
  insertPricingLeadSchema,
} from "@shared/schema";

const statsQuerySchema = z.object({
  ambulatorioId: z.string().uuid("ambulatorioId deve essere un UUID valido"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Pricing Leads - Create new lead
  app.post("/api/pricing-leads", async (req, res) => {
    try {
      const data = insertPricingLeadSchema.parse(req.body);
      const lead = await storage.createPricingLead(data);
      
      console.log(`🎯 Nuovo lead piano ${data.piano}: ${data.email}`);
      
      res.status(201).json({ success: true, leadId: lead.id });
    } catch (error: any) {
      console.error('Errore creazione lead:', error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Pricing Leads - Get all leads (for admin dashboard)
  app.get("/api/pricing-leads", async (req, res) => {
    try {
      const leads = await storage.getPricingLeads();
      
      const stats = {
        total: leads.length,
        byPlan: {
          BASE: leads.filter(l => l.piano === 'BASE').length,
          PROFESSIONAL: leads.filter(l => l.piano === 'PROFESSIONAL').length,
          ENTERPRISE: leads.filter(l => l.piano === 'ENTERPRISE').length,
        },
        byStatus: {
          NUOVO: leads.filter(l => l.status === 'NUOVO').length,
          CONTATTATO: leads.filter(l => l.status === 'CONTATTATO').length,
          CONVERTITO: leads.filter(l => l.status === 'CONVERTITO').length,
          PERSO: leads.filter(l => l.status === 'PERSO').length,
        }
      };
      
      res.json({ leads, stats });
    } catch (error: any) {
      console.error('Errore fetch leads:', error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  // Pricing Leads - Update lead status
  app.patch("/api/pricing-leads/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["NUOVO", "CONTATTATO", "CONVERTITO", "PERSO"].includes(status)) {
        return res.status(400).json({ error: "Status non valido" });
      }
      
      const lead = await storage.updatePricingLeadStatus(id, status);
      res.json(lead);
    } catch (error: any) {
      console.error('Errore aggiornamento lead:', error);
      if (error.message === "Lead non trovato") {
        return res.status(404).json({ error: "Lead non trovato" });
      }
      res.status(500).json({ error: "Errore server" });
    }
  });
  
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

  app.patch("/api/ambulatori/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const data = updateAmbulatorioSchema.parse(req.body);
      const ambulatorio = await storage.updateAmbulatorio(id, data);
      res.json(ambulatorio);
    } catch (error: any) {
      if (error.message === "Ambulatorio non trovato") {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }
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

  app.get("/api/users/ambulatorio/:ambulatorioId/default", async (req, res) => {
    try {
      const users = await storage.getUsersByAmbulatorio(req.params.ambulatorioId);
      if (!users || users.length === 0) {
        return res.status(404).json({ error: "Nessun utente trovato per questo ambulatorio" });
      }
      const defaultUser = users.find(u => u.ruolo === "medico") || users[0];
      res.json(defaultUser);
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
      const { ambulatorioId, search, sesso, citta, provincia, etaMin, etaMax } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      // Se ci sono filtri avanzati, usa searchPazientiAdvanced
      const hasAdvancedFilters = sesso || citta || provincia || etaMin || etaMax;
      
      let pazienti;
      if (search || hasAdvancedFilters) {
        const filters: any = {};
        if (search && typeof search === 'string') filters.query = search;
        if (sesso && typeof sesso === 'string') filters.sesso = sesso;
        if (citta && typeof citta === 'string') filters.citta = citta;
        if (provincia && typeof provincia === 'string') filters.provincia = provincia;
        
        // Valida età min con guard NaN e valori negativi
        if (etaMin && typeof etaMin === 'string') {
          const parsedMin = parseInt(etaMin, 10);
          if (!isNaN(parsedMin) && parsedMin >= 0 && parsedMin <= 150) {
            filters.etaMin = parsedMin;
          }
        }
        
        // Valida età max con guard NaN e valori negativi
        if (etaMax && typeof etaMax === 'string') {
          const parsedMax = parseInt(etaMax, 10);
          if (!isNaN(parsedMax) && parsedMax >= 0 && parsedMax <= 150) {
            filters.etaMax = parsedMax;
          }
        }
        
        pazienti = await storage.searchPazientiAdvanced(ambulatorioId, filters);
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
      if (error.errors) {
        return res.status(400).json({ error: "Dati non validi", details: error.errors });
      }
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/pazienti/:id", async (req, res) => {
    try {
      // Normalize telefono by removing spaces, dashes, parentheses
      if (req.body.telefono) {
        req.body.telefono = req.body.telefono.replace(/[\s\-\(\)]/g, '');
      }
      
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
        const targetDate = new Date(date);
        const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
        appuntamenti = await storage.getAppuntamentiByWeek(ambulatorioId, weekStart, weekEnd);
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

      const newStart = new Date(data.dataOra);
      const newEnd = new Date(newStart.getTime() + (data.durata || 30) * 60000);

      const existingAppuntamenti = await storage.getAppuntamentiByMedico(data.medicoId!);
      
      const hasConflict = existingAppuntamenti.some(apt => {
        const aptStart = new Date(apt.dataOra);
        const aptEnd = new Date(aptStart.getTime() + apt.durata * 60000);
        return (newStart < aptEnd && newEnd > aptStart);
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Conflitto: esiste già un appuntamento in questo orario" });
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

  app.get("/api/visite", async (req, res) => {
    try {
      const { ambulatorioId, pazienteId, medicoId } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      let visite;
      
      if (pazienteId && typeof pazienteId === 'string') {
        visite = await storage.getVisiteByPaziente(pazienteId);
      } else if (medicoId && typeof medicoId === 'string') {
        visite = await storage.getVisiteByMedico(medicoId);
      } else {
        visite = await storage.getVisite(ambulatorioId);
      }
      
      res.json(visite);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/visite/:id", async (req, res) => {
    try {
      const visita = await storage.getVisita(req.params.id);
      if (!visita) {
        return res.status(404).json({ error: "Visita non trovata" });
      }
      res.json(visita);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/visite", async (req, res) => {
    try {
      const data = insertVisitaSchema.parse(req.body);
      
      if (!data.medicoId && data.ambulatorioId) {
        const medici = await storage.getUsersByAmbulatorio(data.ambulatorioId);
        if (medici.length > 0) {
          data.medicoId = medici[0].id;
        } else {
          return res.status(400).json({ error: "Nessun medico disponibile per questo ambulatorio" });
        }
      }
      
      const visita = await storage.createVisita(data);
      res.status(201).json(visita);
    } catch (error) {
      console.error("Errore creazione visita:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/visite/:id", async (req, res) => {
    try {
      const data = updateVisitaSchema.parse(req.body);
      const visita = await storage.updateVisita(req.params.id, data);
      res.json(visita);
    } catch (error: any) {
      console.error("Errore update visita:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/visite/:id", async (req, res) => {
    try {
      await storage.deleteVisita(req.params.id);
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

  // Subscription routes
  app.get("/api/subscription", async (req, res) => {
    try {
      const validation = z.object({
        ambulatorioId: z.string()
      }).safeParse(req.query);

      if (!validation.success) {
        return res.status(400).json({ 
          error: "ambulatorioId richiesto", 
          details: validation.error.issues 
        });
      }

      const subscription = await storage.getSubscription(validation.data.ambulatorioId);
      
      if (!subscription) {
        return res.status(404).json({ error: "Subscription non trovata" });
      }

      res.json(subscription);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.put("/api/subscription", async (req, res) => {
    try {
      const validation = updateSubscriptionSchema.extend({
        ambulatorioId: z.string() // Richiesto per PUT
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ 
          error: "Dati non validi", 
          details: validation.error.issues 
        });
      }

      const { ambulatorioId, ...updateData } = validation.data;
      const updatedSubscription = await storage.updateSubscription(ambulatorioId, updateData);

      res.json(updatedSubscription);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  // AI Routes
  const { checkAIQuota, incrementAIUsage } = await import("./ai/usage");
  const { transcribeAudio } = await import("./ai/whisper");
  const multer = await import("multer");
  const upload = multer.default({ storage: multer.memoryStorage() });

  app.post("/api/ai/transcribe", upload.single("audio"), async (req, res) => {
    try {
      const { ambulatorioId, userId } = req.body;
      
      if (!ambulatorioId || !userId) {
        return res.status(400).json({ error: "ambulatorioId e userId richiesti" });
      }

      // Check quota
      const quota = await checkAIQuota(ambulatorioId, userId, 'voiceNotes');
      if (!quota.allowed) {
        return res.status(429).json({
          error: 'Limite voice notes raggiunto',
          quota: {
            used: quota.used,
            limit: quota.limit,
            resetDate: quota.resetDate
          }
        });
      }

      const audioFile = req.file;
      if (!audioFile) {
        return res.status(400).json({ error: 'File audio mancante' });
      }

      // Validate file size (max 25MB)
      if (audioFile.size > 25 * 1024 * 1024) {
        return res.status(400).json({ error: 'File troppo grande (max 25MB)' });
      }

      // Convert buffer to File-like object for OpenAI
      const file = new File([audioFile.buffer], audioFile.originalname, {
        type: audioFile.mimetype
      });

      // Transcribe
      const result = await transcribeAudio(file);

      // Increment usage
      await incrementAIUsage(ambulatorioId, userId, 'voiceNotes');

      // Get updated quota
      const updatedQuota = await checkAIQuota(ambulatorioId, userId, 'voiceNotes');

      res.json({
        success: true,
        result,
        quota: {
          used: updatedQuota.used,
          limit: updatedQuota.limit,
          resetDate: updatedQuota.resetDate,
          percentageUsed: updatedQuota.percentageUsed
        }
      });
    } catch (error: any) {
      console.error('Errore trascrizione:', error);
      res.status(500).json({ 
        error: error.message || 'Errore durante la trascrizione' 
      });
    }
  });

  app.get("/api/ai/quota", async (req, res) => {
    try {
      const { ambulatorioId, userId } = req.query;

      if (!ambulatorioId || typeof ambulatorioId !== 'string' || 
          !userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'ambulatorioId e userId richiesti' });
      }

      const subscription = await storage.getSubscription(ambulatorioId);
      const voiceQuota = await checkAIQuota(ambulatorioId, userId, 'voiceNotes');

      res.json({
        plan: subscription?.piano || 'BASE',
        voiceNotes: voiceQuota
      });
    } catch (error) {
      console.error('Errore quota:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
