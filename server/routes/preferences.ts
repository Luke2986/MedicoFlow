import type { Express } from "express";
import { storage } from "../storage";
import { logError } from "../log";

export function registerPreferenceRoutes(app: Express) {
  // User Preferences API
  app.get("/api/preferences/:userId", async (req, res) => {
    try {
      if (req.params.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Preferenze non trovate' });
      }
      const preferences = await storage.getUserPreferences(req.params.userId);
      if (!preferences) {
        return res.status(404).json({ error: 'Preferenze non trovate' });
      }
      res.json(preferences);
    } catch (error) {
      logError('Errore get preferences:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  app.post("/api/preferences/:userId", async (req, res) => {
    try {
      if (req.params.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Preferenze non trovate' });
      }
      const preferences = await storage.upsertUserPreferences(req.params.userId, req.body);
      res.json(preferences);
    } catch (error) {
      logError('Errore upsert preferences:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  app.delete("/api/preferences/:userId", async (req, res) => {
    try {
      if (req.params.userId !== req.user!.id) {
        return res.status(404).json({ error: 'Preferenze non trovate' });
      }
      await storage.deleteUserPreferences(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      logError('Errore delete preferences:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
