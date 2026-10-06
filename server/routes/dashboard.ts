import type { Express } from "express";
import { requireAdmin } from "../authz";
import { startOfWeek } from "date-fns";
import { updateSubscriptionSchema } from "../../shared/schema";
import { storage } from "../storage";
import { z } from "zod";

const statsQuerySchema = z.object({
  ambulatorioId: z.string().uuid("ambulatorioId deve essere un UUID valido"),
});

export function registerDashboardRoutes(app: Express) {
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

  app.put("/api/subscription", requireAdmin, async (req, res) => {
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
}
