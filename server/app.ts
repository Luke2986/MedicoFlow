import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, logError } from "./log";
import { applySecurityMiddleware } from "./security";

export async function createApp(): Promise<Express> {
  const app = express();
  applySecurityMiddleware(app);
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Only metadata is logged: response bodies contain patient data.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
      }
    });
    next();
  });

  await registerRoutes(app);

  // Unknown API paths must not fall through to the SPA's index.html.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Non trovato" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    // Internal error details stay in the server logs; clients only see them for 4xx errors.
    const message = status < 500 ? err.message : "Errore interno del server";

    logError("Errore non gestito:", err);
    res.status(status).json({ message });
  });

  return app;
}
