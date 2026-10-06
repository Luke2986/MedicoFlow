import type { Express } from "express";
import { aiLimiter } from "../security";
import { insertThemeSettingsSchema } from "../../shared/schema";
import { extractColorsFromUrl, getDefaultPalette } from "../ai/color-extractor";
import { storage } from "../storage";
import { logError } from "../log";

export function registerThemeRoutes(app: Express) {
  // Theme Settings - Extract colors from URL with AI
  app.post("/api/theme/extract", aiLimiter, async (req, res) => {
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
      logError('Error extracting colors:', error);
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
      logError('Error fetching theme:', error);
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
      logError('Error saving theme:', error);
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
      logError('Error resetting theme:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
