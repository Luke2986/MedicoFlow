import type { Express } from "express";
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
