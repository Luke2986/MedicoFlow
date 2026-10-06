import type { Express } from "express";
import { storage } from "../storage";
import { logError } from "../log";

export function registerOnboardingRoutes(app: Express) {
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
      logError('Errore onboarding:', error);
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
      logError('Errore update onboarding:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
