import type { Request, Response, NextFunction, RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth, isRuolo, type AuthUser } from "./auth";
import { isInMemory } from "./db";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function loadUser(req: Request): Promise<AuthUser | undefined> {
  const result = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!result) return undefined;
  const u = result.user as typeof result.user & { cognome: string; ruolo: string; ambulatorioId: string };
  // A demo session comes from the cookie cache: make sure the user still exists after a reset of this instance.
  if (isInMemory && !(await storage.getUser(u.id))) return undefined;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    cognome: u.cognome,
    ruolo: isRuolo(u.ruolo) ? u.ruolo : "medico",
    ambulatorioId: u.ambulatorioId,
  };
}

/**
 * Requires a signed-in user and pins every `ambulatorioId` / `userId` the client sends
 * to the caller's own, so list and create endpoints can never reach another clinic's data.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const user = await loadUser(req);
    if (!user) {
      return res.status(401).json({ error: "Accesso richiesto" });
    }
    req.user = user;

    const query = req.query as Record<string, unknown>;
    if ("ambulatorioId" in query) query.ambulatorioId = user.ambulatorioId;
    if ("userId" in query) query.userId = user.id;

    if (req.body && typeof req.body === "object" && !Array.isArray(req.body)) {
      if ("ambulatorioId" in req.body) req.body.ambulatorioId = user.ambulatorioId;
      if ("userId" in req.body) req.body.userId = user.id;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.ruolo !== "admin") {
    return res.status(403).json({ error: "Operazione riservata all'amministratore" });
  }
  next();
}

/** True when the record belongs to the caller's clinic; otherwise answers 404 so ids of other clinics aren't confirmed. */
export function ownsRecord(
  req: Request,
  res: Response,
  record: { ambulatorioId: string } | undefined | null,
  notFoundMessage: string,
): record is { ambulatorioId: string } {
  if (!record || record.ambulatorioId !== req.user!.ambulatorioId) {
    res.status(404).json({ error: notFoundMessage });
    return false;
  }
  return true;
}
