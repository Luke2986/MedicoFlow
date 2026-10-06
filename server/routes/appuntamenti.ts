import type { Express } from "express";
import { ownsRecord } from "../authz";
import { startOfWeek, endOfWeek } from "date-fns";
import { insertAppuntamentoSchema, updateAppuntamentoSchema } from "../../shared/schema";
import { pazienteInClinic, resolveMedicoId } from "./helpers";
import { storage } from "../storage";
import { logError } from "../log";

export function registerAppuntamentoRoutes(app: Express) {
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
      
      res.json(appuntamenti.filter((a) => a.ambulatorioId === ambulatorioId));
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/appuntamenti/:id", async (req, res) => {
    try {
      const appuntamento = await storage.getAppuntamento(req.params.id);
      if (!ownsRecord(req, res, appuntamento, "Appuntamento non trovato")) return;
      res.json(appuntamento);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/appuntamenti", async (req, res) => {
    try {
      const data = insertAppuntamentoSchema.parse(req.body);

      if (!(await pazienteInClinic(req, data.pazienteId))) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      const medicoId = await resolveMedicoId(req, data.medicoId);
      if (!medicoId) {
        return res.status(400).json({ error: "Nessun medico disponibile per questo ambulatorio" });
      }
      const newStart = new Date(data.dataOra);
      const newEnd = new Date(newStart.getTime() + (data.durata || 30) * 60000);

      const existingAppuntamenti = await storage.getAppuntamentiByMedico(medicoId);
      
      const hasConflict = existingAppuntamenti.some(apt => {
        const aptStart = new Date(apt.dataOra);
        const aptEnd = new Date(aptStart.getTime() + apt.durata * 60000);
        return (newStart < aptEnd && newEnd > aptStart);
      });

      if (hasConflict) {
        return res.status(409).json({ error: "Conflitto: esiste già un appuntamento in questo orario" });
      }
      
      const appuntamento = await storage.createAppuntamento({ ...data, medicoId });
      res.status(201).json(appuntamento);
    } catch (error) {
      logError("Errore creazione appuntamento:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/appuntamenti/:id", async (req, res) => {
    try {
      const existing = await storage.getAppuntamento(req.params.id);
      if (!ownsRecord(req, res, existing, "Appuntamento non trovato")) return;

      const data = updateAppuntamentoSchema.parse(req.body);
      if (data.pazienteId && !(await pazienteInClinic(req, data.pazienteId))) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      if (data.medicoId && !(await resolveMedicoId(req, data.medicoId))) {
        return res.status(404).json({ error: "Medico non trovato" });
      }
      const appuntamento = await storage.updateAppuntamento(req.params.id, data);
      res.json(appuntamento);
    } catch (error: any) {
      logError("Errore update appuntamento:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/appuntamenti/:id", async (req, res) => {
    try {
      const existing = await storage.getAppuntamento(req.params.id);
      if (!ownsRecord(req, res, existing, "Appuntamento non trovato")) return;
      await storage.deleteAppuntamento(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  });
}
