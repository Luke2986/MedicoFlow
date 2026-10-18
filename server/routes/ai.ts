import type { Express, RequestHandler } from "express";
import { aiLimiter } from "../security";
import { storage } from "../storage";
import { logError } from "../log";
import multer from "multer";
import { transcribeAudio, TRANSCRIPTION_MODEL, TRANSCRIPTION_PROVIDER } from "../ai/whisper";
import { requireAdmin } from "../authz";
import { z } from "zod";
import type { MotoreReferto } from "../../shared/referto";
import { fornitoreReferto, strutturaReferto, strutturazioneLlmDisponibile } from "../ai/referto";
import { MODELLO_SIMULATO, PROVIDER_SIMULATO, attesaSimulata, dettaturaSimulata, simulazioneAttiva } from "../ai/simulazione";

const refertoSchema = z.object({
  pazienteId: z.string().min(1, "Paziente obbligatorio"),
  testo: z.string().trim().min(1, "Il testo della dettatura è vuoto").max(20_000, "Dettatura troppo lunga (max 20.000 caratteri)"),
});

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
    // Multipart bodies are parsed after requireAuth, so the identity comes from the session here.
    const ambulatorioId = req.user!.ambulatorioId;
    const userId = req.user!.id;
    const pazienteId = typeof req.body?.pazienteId === "string" ? req.body.pazienteId : "";
    const simulata = simulazioneAttiva();
    const audit = (esito: string, auditPazienteId: string | null) =>
      storage.logAiUsage({
        ambulatorioId,
        userId,
        pazienteId: auditPazienteId,
        azione: "trascrizione",
        provider: simulata ? PROVIDER_SIMULATO : TRANSCRIPTION_PROVIDER,
        modello: simulata ? MODELLO_SIMULATO : TRANSCRIPTION_MODEL,
        byteAudio: req.file?.size ?? null,
        esito,
      });

    try {
      const paziente = pazienteId ? await storage.getPaziente(pazienteId) : undefined;
      if (!paziente || paziente.ambulatorioId !== ambulatorioId) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      const consenso = await storage.getConsensoAiAttivo(paziente.id);
      if (!consenso || !consenso.consensoRegistrazione) {
        await audit("negato_consenso", paziente.id);
        return res.status(403).json({
          code: "CONSENSO_AI_MANCANTE",
          error: "Il paziente non ha ricevuto l'informativa AI o non ha acconsentito alla trascrizione",
        });
      }

      const audioFile = req.file;
      // The demo simulation records no audio: it dictates from the patient's history instead.
      if (!audioFile && !simulata) {
        return res.status(400).json({ error: 'File audio mancante' });
      }

      let result;
      try {
        if (simulata) {
          const text = dettaturaSimulata(await storage.getVisiteByPaziente(paziente.id));
          await attesaSimulata(1200 + Math.min(1800, text.split(" ").length * 10));
          result = { text };
        } else {
          result = await transcribeAudio(new File([audioFile!.buffer], audioFile!.originalname, { type: audioFile!.mimetype }));
        }
      } catch (error) {
        await audit("errore", paziente.id);
        throw error;
      }
      await audit("ok", paziente.id);

      res.json({ success: true, result });
    } catch (error: any) {
      logError('Errore trascrizione:', error);
      res.status(500).json({ 
        error: error.message || 'Errore durante la trascrizione' 
      });
    }
  });

  app.get("/api/ai/stato", (_req, res) => {
    if (simulazioneAttiva()) return res.json({ trascrizione: true, strutturazione: "simulato", simulazione: true });
    const disponibile = strutturazioneLlmDisponibile();
    res.json({ trascrizione: disponibile, strutturazione: disponibile ? "llm" : "regole", simulazione: false });
  });

  app.post("/api/ai/referto", aiLimiter, async (req, res) => {
    const parsed = refertoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" });
    const { pazienteId, testo } = parsed.data;
    const ambulatorioId = req.user!.ambulatorioId;
    const audit = (esito: string, motore: MotoreReferto) =>
      storage.logAiUsage({
        ambulatorioId,
        userId: req.user!.id,
        pazienteId,
        azione: "strutturazione",
        ...fornitoreReferto(motore),
        byteAudio: null,
        esito,
      });

    try {
      const paziente = await storage.getPaziente(pazienteId);
      if (!paziente || paziente.ambulatorioId !== ambulatorioId) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      const motorePrevisto: MotoreReferto = simulazioneAttiva() ? "simulato" : strutturazioneLlmDisponibile() ? "llm" : "regole";
      const consenso = await storage.getConsensoAiAttivo(paziente.id);
      if (!consenso || !consenso.consensoRegistrazione) {
        await audit("negato_consenso", motorePrevisto);
        return res.status(403).json({
          code: "CONSENSO_AI_MANCANTE",
          error: "Il paziente non ha ricevuto l'informativa AI o non ha acconsentito",
        });
      }
      const ambulatorio = await storage.getAmbulatorio(ambulatorioId);
      // Only the dictated text and the clinic's specialty leave the server: no patient identifiers.
      const proposta = await strutturaReferto(testo, { specializzazione: ambulatorio?.specializzazione ?? "non indicata" });
      await audit("ok", proposta.motore);
      res.json(proposta);
    } catch (error) {
      logError("Errore strutturazione referto:", error instanceof Error ? error.message : "errore");
      res.status(500).json({ error: "Errore durante la strutturazione del referto" });
    }
  });

  app.get("/api/ai/audit", requireAdmin, async (req, res) => {
    try {
      const entries = await storage.getAiAuditLog(req.user!.ambulatorioId, 200);
      res.json(entries);
    } catch (error) {
      logError('Errore audit AI:', error);
      res.status(500).json({ error: 'Errore server' });
    }
  });
}
