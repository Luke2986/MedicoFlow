import express, { type Express, type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log, logError } from "./log";
import { applySecurityMiddleware } from "./security";
import { toNodeHandler } from "better-auth/node";
import { auth, CLIENT_IP_HEADER } from "./auth";
import { prepareDatabase } from "./prepare-db";

export async function createApp(): Promise<Express> {
  await prepareDatabase();
  const app = express();
  applySecurityMiddleware(app);
  // Better Auth parses its own request bodies, so it must be mounted before express.json().
  app.all("/api/auth/*", (req, _res, next) => {
    // Overwrites any client-sent value, so the sign-in rate limit can't be dodged with a forged header.
    req.headers[CLIENT_IP_HEADER] = req.ip ?? "";
    next();
  }, toNodeHandler(auth));
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

  registerRoutes(app);

  // Unknown API paths must not fall through to the SPA's index.html.
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Non trovato" });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Better Auth errors carry a text `status` ("INTERNAL_SERVER_ERROR"); only numeric HTTP codes are usable.
    const status = [err.statusCode, err.status].find((s) => Number.isInteger(s) && s >= 400 && s < 600) ?? 500;
    // Internal error details stay in the server logs; clients only see them for 4xx errors.
    const message = status < 500 ? err.message : "Errore interno del server";

    logError("Errore non gestito:", err);
    res.status(status).json({ message });
  });

  return app;
}
