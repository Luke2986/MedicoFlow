import type { Express } from "express";
import { ownsRecord } from "../authz";
import { insertVisitaSchema, updateVisitaSchema } from "../../shared/schema";
import { renderToStream } from "@react-pdf/renderer";
import { pazienteInClinic, resolveMedicoId } from "./helpers";
import { storage } from "../storage";
import { logError } from "../log";
import CartellaClinicaPDF from "../../client/src/lib/pdf/cartella-pdf";

export function registerVisitaRoutes(app: Express) {
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
      
      res.json(visite.filter((v) => v.ambulatorioId === ambulatorioId));
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/visite/:id/pdf", async (req, res) => {
    try {
      const visitaId = req.params.id;
      
      // Carica visita
      const visita = await storage.getVisita(visitaId);
      if (!ownsRecord(req, res, visita, "Visita non trovata")) return;

      // Carica paziente
      const paziente = await storage.getPaziente(visita.pazienteId);
      if (!paziente) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }

      // Carica ambulatorio
      const ambulatorio = await storage.getAmbulatorio(paziente.ambulatorioId);
      if (!ambulatorio) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }

      // Carica medico per nome
      const medico = await storage.getUser(visita.medicoId);
      const medicoNome = medico ? `Dr. ${medico.cognome} ${medico.nome}` : 'Medico Sconosciuto';

      // Genera PDF
      const pdfStream = await renderToStream(
        CartellaClinicaPDF({
          visita,
          paziente,
          ambulatorio,
          medicoNome
        })
      );

      // Imposta headers per download
      const fileName = `Cartella_${paziente.cognome}_${paziente.nome}_${new Date(visita.dataVisita).toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Stream PDF to response
      pdfStream.pipe(res);
    } catch (error: any) {
      logError("Errore generazione PDF:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
    }
  });

  app.get("/api/visite/:id", async (req, res) => {
    try {
      const visita = await storage.getVisita(req.params.id);
      if (!ownsRecord(req, res, visita, "Visita non trovata")) return;
      res.json(visita);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/visite", async (req, res) => {
    try {
      const data = insertVisitaSchema.parse(req.body);

      if (!(await pazienteInClinic(req, data.pazienteId))) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      if (data.appuntamentoId) {
        const appuntamento = await storage.getAppuntamento(data.appuntamentoId);
        if (!appuntamento || appuntamento.ambulatorioId !== req.user!.ambulatorioId) {
          return res.status(404).json({ error: "Appuntamento non trovato" });
        }
      }
      const medicoId = await resolveMedicoId(req, data.medicoId);
      if (!medicoId) {
        return res.status(400).json({ error: "Nessun medico disponibile per questo ambulatorio" });
      }
      const visita = await storage.createVisita({ ...data, medicoId });
      res.status(201).json(visita);
    } catch (error) {
      logError("Errore creazione visita:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.patch("/api/visite/:id", async (req, res) => {
    try {
      const existing = await storage.getVisita(req.params.id);
      if (!ownsRecord(req, res, existing, "Visita non trovata")) return;

      const data = updateVisitaSchema.parse(req.body);
      if (data.pazienteId && !(await pazienteInClinic(req, data.pazienteId))) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      if (data.medicoId && !(await resolveMedicoId(req, data.medicoId))) {
        return res.status(404).json({ error: "Medico non trovato" });
      }
      const visita = await storage.updateVisita(req.params.id, data);
      res.json(visita);
    } catch (error: any) {
      logError("Errore update visita:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/visite/:id", async (req, res) => {
    try {
      const existing = await storage.getVisita(req.params.id);
      if (!ownsRecord(req, res, existing, "Visita non trovata")) return;
      await storage.deleteVisita(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  });
}
