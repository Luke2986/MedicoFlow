import type { Express } from "express";
import { requireAdmin, ownsRecord } from "../authz";
import { updateAmbulatorioSchema } from "../../shared/schema";
import { storage } from "../storage";

export function registerAmbulatorioRoutes(app: Express) {
  app.get("/api/ambulatori-list", async (req, res) => {
    try {
      const ambulatorio = await storage.getAmbulatorio(req.user!.ambulatorioId);
      res.json(ambulatorio ? [ambulatorio] : []);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/ambulatori/:id", async (req, res) => {
    try {
      const ambulatorio = req.params.id === req.user!.ambulatorioId
        ? await storage.getAmbulatorio(req.params.id)
        : undefined;
      if (!ambulatorio) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }
      res.json(ambulatorio);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.patch("/api/ambulatori/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      if (id !== req.user!.ambulatorioId) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }
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
      if (!ownsRecord(req, res, user, "Utente non trovato")) return;
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });
}
