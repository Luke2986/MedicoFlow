import type { Express } from "express";
import { z } from "zod";
import { count } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { db } from "./db";
import { storage } from "./storage";
import { users, RUOLI } from "../shared/schema";
import { createUserWithPassword, setUserPassword, deleteUserAccount, MIN_PASSWORD_LENGTH } from "./auth";
import { requireAdmin } from "./authz";
import { logError } from "./log";

const password = z.string().min(MIN_PASSWORD_LENGTH, `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri`).max(128);
const nome = z.string().trim().min(1, "Campo obbligatorio").max(100);

const setupSchema = z.object({
  nome,
  cognome: nome,
  email: z.string().trim().email("Email non valida"),
  password,
  nomeAmbulatorio: z.string().trim().min(1, "Campo obbligatorio").max(200),
});

const newMemberSchema = z.object({
  nome,
  cognome: nome,
  email: z.string().trim().email("Email non valida"),
  password,
  ruolo: z.enum(RUOLI),
});

const setupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });

async function hasUsers() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return value > 0;
}

function publicUser(u: { id: string; email: string; nome: string; cognome: string; ruolo: string; createdAt: Date }) {
  return { id: u.id, email: u.email, nome: u.nome, cognome: u.cognome, ruolo: u.ruolo, createdAt: u.createdAt };
}

/** Routes reachable without a session: first-run setup only. */
export function registerSetupRoutes(app: Express) {
  app.get("/api/setup/status", async (_req, res, next) => {
    try {
      res.json({ needsSetup: !(await hasUsers()) });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/setup", setupLimiter, async (req, res) => {
    const parsed = setupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" });
    }

    try {
      // Setup is a one-shot operation: once any account exists it is permanently closed.
      if (await hasUsers()) {
        return res.status(409).json({ error: "Configurazione iniziale già completata" });
      }

      const data = parsed.data;
      const ambulatorio = await storage.createAmbulatorio({
        nome: data.nomeAmbulatorio,
        indirizzo: "",
        citta: "",
        provincia: "",
        cap: "",
        telefono: "",
        email: data.email.toLowerCase(),
        piva: "",
        regione: "",
        specializzazione: "Medicina Generale",
      });

      await createUserWithPassword({
        email: data.email,
        password: data.password,
        nome: data.nome,
        cognome: data.cognome,
        ruolo: "admin",
        ambulatorioId: ambulatorio.id,
      });

      res.status(201).json({ success: true });
    } catch (error) {
      logError("Errore setup iniziale:", error);
      res.status(500).json({ error: "Errore durante la configurazione iniziale" });
    }
  });
}

/** Routes that require a session (registered after requireAuth). */
export function registerAccountRoutes(app: Express) {
  app.get("/api/me", async (req, res, next) => {
    try {
      const user = req.user!;
      const ambulatorio = await storage.getAmbulatorio(user.ambulatorioId);
      res.json({
        user: { id: user.id, email: user.email, nome: user.name, cognome: user.cognome, ruolo: user.ruolo, ambulatorioId: user.ambulatorioId },
        ambulatorio,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/team", async (req, res, next) => {
    try {
      const members = await storage.getUsersByAmbulatorio(req.user!.ambulatorioId);
      res.json(members.map(publicUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/team", requireAdmin, async (req, res) => {
    const parsed = newMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" });
    }
    try {
      if (await storage.getUserByEmail(parsed.data.email.toLowerCase())) {
        return res.status(409).json({ error: "Esiste già un utente con questa email" });
      }
      const created = await createUserWithPassword({ ...parsed.data, ambulatorioId: req.user!.ambulatorioId });
      const member = await storage.getUser(created.id);
      res.status(201).json(member ? publicUser(member) : { id: created.id });
    } catch (error) {
      logError("Errore creazione utente:", error);
      res.status(500).json({ error: "Errore durante la creazione dell'utente" });
    }
  });

  app.post("/api/team/:id/password", requireAdmin, async (req, res) => {
    const parsed = z.object({ password }).safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" });
    }
    try {
      const member = await storage.getUser(req.params.id);
      if (!member || member.ambulatorioId !== req.user!.ambulatorioId) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      await setUserPassword(member.id, parsed.data.password);
      res.json({ success: true });
    } catch (error) {
      logError("Errore reset password:", error);
      res.status(500).json({ error: "Errore durante il cambio password" });
    }
  });

  app.delete("/api/team/:id", requireAdmin, async (req, res) => {
    try {
      const member = await storage.getUser(req.params.id);
      if (!member || member.ambulatorioId !== req.user!.ambulatorioId) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      if (member.id === req.user!.id) {
        return res.status(400).json({ error: "Non puoi eliminare il tuo account" });
      }
      await deleteUserAccount(member.id);
      res.status(204).send();
    } catch (error: any) {
      if (error?.code === "23503" || error?.cause?.code === "23503") {
        return res.status(409).json({ error: "L'utente ha visite o appuntamenti associati e non può essere eliminato" });
      }
      logError("Errore eliminazione utente:", error);
      res.status(500).json({ error: "Errore durante l'eliminazione dell'utente" });
    }
  });
}
