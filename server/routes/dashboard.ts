import type { Express } from "express";
import { endOfWeek, startOfWeek } from "date-fns";
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

      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const appuntamentiSettimana = appuntamentiTotali.filter((app) => {
        const dataOra = new Date(app.dataOra);
        return dataOra >= weekStart && dataOra <= weekEnd;
      });

      // Share of this week's appointments, already due, where the patient actually showed up.
      const completati = appuntamentiSettimana.filter((app) => app.stato === "completato").length;
      const mancati = appuntamentiSettimana.filter((app) => app.stato === "no-show").length;

      res.json({
        totalePazienti: pazienti.length,
        appuntamentiOggi: appuntamentiOggi.length,
        appuntamentiSettimana: appuntamentiSettimana.length,
        tassoAttivita: completati + mancati > 0 ? Math.round((completati / (completati + mancati)) * 100) : 0,
      });
    } catch (error) {
      res.status(500).json({ error: "Errore del server" });
    }
  });
}
