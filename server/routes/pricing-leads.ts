import type { Express } from "express";
import { leadLimiter, requireAdminToken } from "../security";
import { insertPricingLeadSchema } from "../../shared/schema";
import { storage } from "../storage";
import { logError } from "../log";

export function registerPricingLeadRoutes(app: Express) {
  // Pricing Leads - Create new lead
  app.post("/api/pricing-leads", leadLimiter, async (req, res) => {
    try {
      const data = insertPricingLeadSchema.parse(req.body);
      const lead = await storage.createPricingLead(data);
      
      res.status(201).json({ success: true, leadId: lead.id });
    } catch (error: any) {
      logError('Errore creazione lead:', error);
      res.status(400).json({ error: "Dati non validi" });
    }
  });

  // Pricing Leads - Get all leads (for admin dashboard)
  app.get("/api/pricing-leads", requireAdminToken, async (req, res) => {
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
      logError('Errore fetch leads:', error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  // Pricing Leads - Update lead status
  app.patch("/api/pricing-leads/:id/status", requireAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["NUOVO", "CONTATTATO", "CONVERTITO", "PERSO"].includes(status)) {
        return res.status(400).json({ error: "Status non valido" });
      }
      
      const lead = await storage.updatePricingLeadStatus(id, status);
      res.json(lead);
    } catch (error: any) {
      logError('Errore aggiornamento lead:', error);
      if (error.message === "Lead non trovato") {
        return res.status(404).json({ error: "Lead non trovato" });
      }
      res.status(500).json({ error: "Errore server" });
    }
  });
}
