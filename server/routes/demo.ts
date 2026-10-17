import type { Express } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth";
import { getDemoLogin, clearDemoLogin } from "../demo/seed";
import { resetDemoDatabase } from "../prepare-db";
import { logError } from "../log";

const resetSchema = z.object({ mode: z.enum(["demo", "empty"]) });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false });

// Resets rebuild the whole database: run them one at a time.
let resetQueue: Promise<unknown> = Promise.resolve();

/** Only registered with the in-memory database, so these routes can never touch a real one. */
export function registerDemoRoutes(app: Express) {
  app.get("/api/demo", (_req, res) => {
    res.json({ demo: true, hasDemoData: !!getDemoLogin() });
  });

  app.post("/api/demo/session", async (req, res, next) => {
    const login = getDemoLogin();
    if (!login) return res.status(404).json({ error: "Dati demo non presenti" });
    try {
      const response = await auth.api.signInEmail({
        body: login,
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });
      if (!response.ok) return res.status(500).json({ error: "Accesso alla demo non riuscito" });
      res.setHeader("Set-Cookie", response.headers.getSetCookie());
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/demo/reset", resetLimiter, async (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Modalità non valida" });

    const { mode } = parsed.data;
    const run = resetQueue.then(async () => {
      if (mode === "empty") clearDemoLogin();
      await resetDemoDatabase(mode);
    });
    resetQueue = run.catch(() => {});
    try {
      await run;
      res.json({ success: true });
    } catch (error) {
      logError("Errore reset demo:", error);
      res.status(500).json({ error: "Ripristino non riuscito" });
    }
  });
}
