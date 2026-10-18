import type { Express } from "express";
import { ownsRecord } from "../authz";
import { insertPazienteSchema, updatePazienteSchema } from "../../shared/schema";
import { renderToStream } from "@react-pdf/renderer";
import { storage } from "../storage";
import { logError } from "../log";
import CartellaClinicaPDF from "../../client/src/lib/pdf/cartella-pdf";
import InformativaAiPDF from "../../client/src/lib/pdf/informativa-pdf";
import { INFORMATIVA_AI_VERSIONE } from "../../shared/informativa-ai";
import { z } from "zod";

const consensoAiSchema = z.object({ consensoRegistrazione: z.boolean() });

export function registerPazienteRoutes(app: Express) {
  app.get("/api/pazienti", async (req, res) => {
    try {
      const { ambulatorioId, search, sesso, citta, provincia, etaMin, etaMax, page, limit } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      // Paginazione
      const currentPage = page && typeof page === 'string' ? parseInt(page, 10) : 1;
      const pageSize = limit && typeof limit === 'string' ? parseInt(limit, 10) : 20;
      const skip = (currentPage - 1) * pageSize;

      // Se ci sono filtri avanzati, usa searchPazientiAdvanced
      const hasAdvancedFilters = sesso || citta || provincia || etaMin || etaMax;
      
      let allPazienti;
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
        
        allPazienti = await storage.searchPazientiAdvanced(ambulatorioId, filters);
      } else {
        allPazienti = await storage.getPazienti(ambulatorioId);
      }

      const total = allPazienti.length;
      const pazienti = allPazienti.slice(skip, skip + pageSize);

      // Arricchisci ogni paziente con età, status e ultima visita
      const pazientiEnriched = await Promise.all(
        pazienti.map(async (p) => {
          const visite = await storage.getVisiteByPaziente(p.id);
          const ultimaVisita = visite.length > 0 
            ? visite.sort((a, b) => new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime())[0]
            : null;

          // Calcola età
          const birthDate = new Date(p.dataNascita);
          const today = new Date();
          let eta = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            eta--;
          }

          // Calcola status
          let status = 'inattivo';
          let isNuovo = false;

          // È nuovo se creato negli ultimi 7 giorni
          const createdAt = new Date(p.createdAt);
          const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
          isNuovo = daysSinceCreation <= 7;

          if (ultimaVisita) {
            const daysSinceLastVisit = Math.floor(
              (Date.now() - new Date(ultimaVisita.dataVisita).getTime()) / (1000 * 60 * 60 * 24)
            );
            
            if (daysSinceLastVisit < 30) {
              status = 'attivo';
            } else if (daysSinceLastVisit < 90) {
              status = 'recente';
            }
          }

          return {
            ...p,
            eta,
            status,
            isNuovo,
            ultimaVisita: ultimaVisita?.dataVisita || null,
          };
        })
      );
      
      res.json({
        pazienti: pazientiEnriched,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/pazienti/export/csv", async (req, res) => {
    try {
      const { ambulatorioId } = req.query;
      
      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: "ambulatorioId richiesto" });
      }

      const pazienti = await storage.getPazienti(ambulatorioId);

      // CSV Headers
      const headers = [
        'Nome',
        'Cognome',
        'Codice Fiscale',
        'Data Nascita',
        'Luogo Nascita',
        'Sesso',
        'Indirizzo',
        'Città',
        'Provincia',
        'CAP',
        'Telefono',
        'Email',
        'Note'
      ].join(',');

      // CSV Rows
      const rows = pazienti.map(p => {
        const dataNascita = new Date(p.dataNascita).toLocaleDateString('it-IT');
        return [
          `"${p.nome}"`,
          `"${p.cognome}"`,
          `"${p.codiceFiscale}"`,
          `"${dataNascita}"`,
          `"${p.luogoNascita}"`,
          `"${p.sesso}"`,
          `"${p.indirizzo}"`,
          `"${p.citta}"`,
          `"${p.provincia}"`,
          `"${p.cap}"`,
          `"${p.telefono}"`,
          `"${p.email || ''}"`,
          `"${p.note || ''}"`
        ].join(',');
      });

      const csv = [headers, ...rows].join('\n');
      const filename = `pazienti-${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + csv); // BOM per Excel
    } catch (error) {
      logError('Errore export CSV:', error);
      res.status(500).json({ error: "Errore durante l'export" });
    }
  });

  app.get("/api/pazienti/codice-fiscale/:cf", async (req, res) => {
    try {
      const paziente = await storage.getPazienteByCodiceFiscale(req.params.cf);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
      res.json(paziente);
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/pazienti/:id/cartella-pdf", async (req, res) => {
    try {
      const pazienteId = req.params.id;
      
      // Carica paziente
      const paziente = await storage.getPaziente(pazienteId);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;

      // Carica ambulatorio
      const ambulatorio = await storage.getAmbulatorio(paziente.ambulatorioId);
      if (!ambulatorio) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }

      // Carica TUTTE le visite del paziente (ordinate cronologicamente)
      const visite = await storage.getVisiteByPaziente(pazienteId);
      const visiteSorted = visite.sort((a, b) => 
        new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime()
      );

      // Carica medico (usa il medico della visita più recente, o default)
      let medicoNome = 'Medico';
      if (visiteSorted.length > 0) {
        const medico = await storage.getUser(visiteSorted[0].medicoId);
        medicoNome = medico ? `Dr. ${medico.cognome} ${medico.nome}` : 'Medico';
      }

      // Genera PDF con componente per cartella completa
      const pdfStream = await renderToStream(
        CartellaClinicaPDF({
          visita: visiteSorted[0] || null, // Prima visita (più recente) per compatibilità
          visite: visiteSorted, // Array completo visite
          paziente,
          ambulatorio,
          medicoNome
        })
      );

      // Imposta headers per download
      const fileName = `CartellaClinica_${paziente.cognome}_${paziente.nome}_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Stream PDF to response
      pdfStream.pipe(res);
    } catch (error: any) {
      logError("Errore generazione PDF cartella:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
    }
  });

  app.get("/api/pazienti/:id/consenso-ai", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
      const consenso = await storage.getConsensoAiAttivo(paziente.id);
      res.json({ consenso: consenso ?? null, versioneCorrente: INFORMATIVA_AI_VERSIONE });
    } catch (error) {
      logError("Errore lettura consenso AI:", error);
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.post("/api/pazienti/:id/consenso-ai", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
      const { consensoRegistrazione } = consensoAiSchema.parse(req.body);
      const consenso = await storage.createConsensoAi({
        ambulatorioId: paziente.ambulatorioId,
        pazienteId: paziente.id,
        versioneInformativa: INFORMATIVA_AI_VERSIONE,
        consensoRegistrazione,
        raccoltoDa: req.user!.id,
      });
      res.status(201).json(consenso);
    } catch (error) {
      logError("Errore registrazione consenso AI:", error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  app.post("/api/pazienti/:id/consenso-ai/revoca", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
      await storage.revocaConsensiAi(paziente.id);
      res.status(204).send();
    } catch (error) {
      logError("Errore revoca consenso AI:", error);
      res.status(500).json({ error: "Errore del server" });
    }
  });

  app.get("/api/pazienti/:id/informativa-ai-pdf", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
      const ambulatorio = await storage.getAmbulatorio(paziente.ambulatorioId);
      if (!ambulatorio) {
        return res.status(404).json({ error: "Ambulatorio non trovato" });
      }
      const pdfStream = await renderToStream(InformativaAiPDF({ paziente, ambulatorio }));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="InformativaAI_${paziente.cognome}_${paziente.nome}.pdf"`);
      pdfStream.pipe(res);
    } catch (error) {
      logError("Errore generazione PDF informativa:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
    }
  });

  app.get("/api/pazienti/:id", async (req, res) => {
    try {
      const paziente = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, paziente, "Paziente non trovato")) return;
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
      
      const existing = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, existing, "Paziente non trovato")) return;

      const data = updatePazienteSchema.parse(req.body);
      const paziente = await storage.updatePaziente(req.params.id, data);
      res.json(paziente);
    } catch (error: any) {
      logError("Errore update paziente:", error);
      res.status(400).json({ error: "Errore durante l'aggiornamento" });
    }
  });

  app.delete("/api/pazienti/:id", async (req, res) => {
    try {
      const existing = await storage.getPaziente(req.params.id);
      if (!ownsRecord(req, res, existing, "Paziente non trovato")) return;
      await storage.deletePaziente(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === "23503" || error?.cause?.code === "23503") {
        return res.status(409).json({ error: "Il paziente ha visite o fatture associate e non può essere eliminato" });
      }
      res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  });
}
