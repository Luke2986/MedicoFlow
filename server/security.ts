import type { Express, Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export function applySecurityMiddleware(app: Express) {
  app.disable("x-powered-by");

  // Behind Vercel or a reverse proxy the client IP is in X-Forwarded-For; trusting it otherwise lets clients spoof their IP.
  if (process.env.VERCEL || process.env.TRUST_PROXY) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));
  }

  const isDev = process.env.NODE_ENV === "development";

  app.use(
    helmet({
      // Vite's dev server injects inline scripts and an HMR websocket, so CSP is only enforced on builds.
      contentSecurityPolicy: isDev
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:", "blob:"],
              mediaSrc: ["'self'", "blob:"],
              workerSrc: ["'self'", "blob:"],
              connectSrc: ["'self'"],
              frameSrc: ["'self'", "blob:"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              // Self-hosted installs may run on plain HTTP; HTTPS is left to the hosting layer.
              upgradeInsecureRequests: null,
            },
          },
    }),
  );

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Troppe richieste, riprova tra qualche minuto." },
    }),
  );
}

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Troppe richieste AI, riprova tra un minuto." },
});

export const leadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Troppe richieste, riprova più tardi." },
});

// Admin-only endpoints stay disabled (404) unless ADMIN_TOKEN is configured.
export function requireAdminToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(404).json({ error: "Non trovato" });
  }

  const provided = req.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Non autorizzato" });
  }

  next();
}
