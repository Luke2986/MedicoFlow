import type { Express } from "express";
import { storage } from "../storage";
import { logError } from "../log";

export function registerSpecializationRoutes(app: Express) {
  // Specializations API
  app.get("/api/specializations", async (_req, res) => {
    try {
      const specializations = await storage.getAllSpecializations();
      res.json(specializations);
    } catch (error) {
      logError('Errore get specializations:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  app.get("/api/specializations/:id", async (req, res) => {
    try {
      const specialization = await storage.getSpecialization(req.params.id);
      if (!specialization) {
        return res.status(404).json({ error: 'Specializzazione non trovata' });
      }
      res.json(specialization);
    } catch (error) {
      logError('Errore get specialization:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  app.get("/api/specializations/slug/:slug", async (req, res) => {
    try {
      const specialization = await storage.getSpecializationBySlug(req.params.slug);
      if (!specialization) {
        return res.status(404).json({ error: 'Specializzazione non trovata' });
      }
      res.json(specialization);
    } catch (error) {
      logError('Errore get specialization by slug:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
