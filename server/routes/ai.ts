import type { Express, RequestHandler } from "express";
import { aiLimiter } from "../security";
import { storage } from "../storage";
import { logError } from "../log";
import multer from "multer";
import { checkAIQuota, incrementAIUsage } from "../ai/usage";
import { transcribeAudio } from "../ai/whisper";

export function registerAiRoutes(app: Express) {
  // 25 MB is Groq Whisper's own upload limit.
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("audio/")),
  });
  const uploadAudio: RequestHandler = (req, res, next) => {
    upload.single("audio")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: "File audio non valido o troppo grande (max 25 MB)" });
      }
      next();
    });
  };

  app.post("/api/ai/transcribe", aiLimiter, uploadAudio, async (req, res) => {
    try {
      // Multipart bodies are parsed after requireAuth, so the identity comes from the session here.
      const ambulatorioId = req.user!.ambulatorioId;
      const userId = req.user!.id;

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
      logError('Errore trascrizione:', error);
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
      logError('Errore quota:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
