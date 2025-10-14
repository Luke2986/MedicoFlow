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
  insertThemeSettingsSchema,
  updateThemeSettingsSchema,
} from "@shared/schema";
import { extractColorsFromUrl, getDefaultPalette } from "./ai/color-extractor";
import { renderToStream } from '@react-pdf/renderer';
import CartellaClinicaPDF from '../client/src/lib/pdf/cartella-pdf';

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
      console.error('Errore export CSV:', error);
      res.status(500).json({ error: "Errore durante l'export" });
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

  app.get("/api/pazienti/:id/cartella-pdf", async (req, res) => {
    try {
      const pazienteId = req.params.id;
      
      // Carica paziente
      const paziente = await storage.getPaziente(pazienteId);
      if (!paziente) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }

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
      console.error("Errore generazione PDF cartella:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
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

  app.get("/api/visite/:id/pdf", async (req, res) => {
    try {
      const visitaId = req.params.id;
      
      // Carica visita
      const visita = await storage.getVisita(visitaId);
      if (!visita) {
        return res.status(404).json({ error: "Visita non trovata" });
      }

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
      console.error("Errore generazione PDF:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
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

  // Theme Settings - Extract colors from URL with AI
  app.post("/api/theme/extract", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'URL mancante' });
      }

      // Valida URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'URL non valido' });
      }

      // Estrai colori con AI
      const palette = await extractColorsFromUrl(url);

      res.json({ 
        success: true,
        palette,
        sourceUrl: url
      });
    } catch (error: any) {
      console.error('Error extracting colors:', error);
      res.status(500).json({ 
        error: error.message || 'Errore durante l\'estrazione dei colori' 
      });
    }
  });

  // Theme Settings - Get current theme
  app.get("/api/theme", async (req, res) => {
    try {
      const { ambulatorioId } = req.query;

      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: 'ambulatorioId richiesto' });
      }

      const settings = await storage.getThemeSettings(ambulatorioId);

      // Se non esiste, return default
      if (!settings) {
        const defaultPalette = getDefaultPalette();
        return res.json({
          ...defaultPalette,
          sourceType: 'default',
          sourceUrl: null
        });
      }

      res.json({
        primary: settings.primaryColor,
        primaryLight: settings.primaryLight,
        primaryDark: settings.primaryDark,
        accent: settings.accentColor,
        success: settings.successColor,
        warning: settings.warningColor,
        error: settings.errorColor,
        sourceType: settings.sourceType,
        sourceUrl: settings.sourceUrl
      });
    } catch (error) {
      console.error('Error fetching theme:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  // Theme Settings - Save/Update theme
  app.put("/api/theme", async (req, res) => {
    try {
      const { 
        ambulatorioId,
        primary, primaryLight, primaryDark, 
        accent, success, warning, error: errorColor,
        sourceType, sourceUrl 
      } = req.body;

      if (!ambulatorioId) {
        return res.status(400).json({ error: 'ambulatorioId richiesto' });
      }

      const data = insertThemeSettingsSchema.parse({
        ambulatorioId,
        primaryColor: primary,
        primaryLight: primaryLight,
        primaryDark: primaryDark,
        accentColor: accent,
        successColor: success,
        warningColor: warning,
        errorColor: errorColor,
        sourceType: sourceType || 'custom',
        sourceUrl: sourceUrl
      });

      const settings = await storage.upsertThemeSettings(ambulatorioId, data);

      res.json({ success: true, settings });
    } catch (error: any) {
      console.error('Error saving theme:', error);
      res.status(400).json({ error: error.message || 'Errore durante il salvataggio' });
    }
  });

  // Theme Settings - Reset to default
  app.delete("/api/theme", async (req, res) => {
    try {
      const { ambulatorioId } = req.query;

      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: 'ambulatorioId richiesto' });
      }

      await storage.deleteThemeSettings(ambulatorioId);

      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting theme:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  // Onboarding Progress - Get or create progress
  app.get("/api/onboarding", async (req, res) => {
    try {
      const { ambulatorioId } = req.query;

      if (!ambulatorioId || typeof ambulatorioId !== 'string') {
        return res.status(400).json({ error: 'ambulatorioId richiesto' });
      }

      // Get or create progress
      let progress = await storage.getOnboardingProgress(ambulatorioId);
      
      if (!progress) {
        progress = await storage.upsertOnboardingProgress(ambulatorioId, {
          ambulatorioId
        });
      }

      // Check stato reale e auto-update
      const [ambulatorio, pazientiCount, appuntamentiCount, themeSettings] = await Promise.all([
        storage.getAmbulatorio(ambulatorioId),
        storage.getPazienti(ambulatorioId).then(p => p.length),
        storage.getAppuntamenti(ambulatorioId).then(a => a.length),
        storage.getThemeSettings(ambulatorioId)
      ]);

      // Auto-update progress
      const updates: any = {};
      let needsUpdate = false;

      if (!progress.profileCompleted && ambulatorio?.telefono && ambulatorio?.piva) {
        updates.profileCompleted = true;
        needsUpdate = true;
      }

      if (!progress.firstPatientAdded && pazientiCount > 0) {
        updates.firstPatientAdded = true;
        needsUpdate = true;
      }

      if (!progress.firstAppointmentAdded && appuntamentiCount > 0) {
        updates.firstAppointmentAdded = true;
        needsUpdate = true;
      }

      if (!progress.themeCustomized && themeSettings) {
        updates.themeCustomized = true;
        needsUpdate = true;
      }

      // Check se tutto completato
      const allCompleted = 
        (progress.profileCompleted || updates.profileCompleted) &&
        (progress.firstPatientAdded || updates.firstPatientAdded) &&
        (progress.firstAppointmentAdded || updates.firstAppointmentAdded) &&
        (progress.themeCustomized || updates.themeCustomized);

      if (allCompleted && !progress.onboardingCompleted) {
        updates.onboardingCompleted = true;
        updates.completedAt = new Date();
        needsUpdate = true;
      }

      if (needsUpdate) {
        progress = await storage.upsertOnboardingProgress(ambulatorioId, updates);
      }

      res.json({
        progress,
        stats: {
          pazientiCount,
          appuntamentiCount,
          hasTheme: !!themeSettings
        }
      });
    } catch (error) {
      console.error('Errore onboarding:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  // Onboarding Progress - Update step
  app.post("/api/onboarding", async (req, res) => {
    try {
      const { ambulatorioId, step } = req.body;

      if (!ambulatorioId) {
        return res.status(400).json({ error: 'ambulatorioId richiesto' });
      }

      if (!step) {
        return res.status(400).json({ error: 'step richiesto' });
      }

      const updates: any = {};
      if (step === 'profile') updates.profileCompleted = true;
      if (step === 'patient') updates.firstPatientAdded = true;
      if (step === 'appointment') updates.firstAppointmentAdded = true;
      if (step === 'theme') updates.themeCustomized = true;

      const progress = await storage.upsertOnboardingProgress(ambulatorioId, updates);

      res.json(progress);
    } catch (error) {
      console.error('Errore update onboarding:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
