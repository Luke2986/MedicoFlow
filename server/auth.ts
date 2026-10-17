import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { randomBytes } from "crypto";
import { db, isInMemory } from "./db";
import { users, session, account, verification, RUOLI, type Ruolo } from "../shared/schema";

const port = process.env.PORT || "5000";

function resolveBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return `http://localhost:${port}`;
}

export const MIN_PASSWORD_LENGTH = 10;

// Set by server/app.ts from Express's req.ip, which honours the `trust proxy` setting.
export const CLIENT_IP_HEADER = "x-medicoflow-client-ip";

// The in-memory demo loses every session on restart anyway, so a per-process secret is enough there.
const secret = process.env.BETTER_AUTH_SECRET || (isInMemory ? randomBytes(32).toString("base64") : undefined);

export const auth = betterAuth({
  secret,
  baseURL: resolveBaseURL(),
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { users, session, account, verification },
  }),
  user: {
    modelName: "users",
    fields: { name: "nome" },
    additionalFields: {
      cognome: { type: "string", required: true, input: false },
      ruolo: { type: "string", required: true, defaultValue: "medico", input: false },
      ambulatorioId: { type: "string", required: true, input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    // Accounts are created only by the first-run setup and by admins from the Team page.
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // Several staff members may sign in from the same clinic IP.
      "/sign-in/email": { window: 60, max: 10 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },
  telemetry: { enabled: false },
});

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  cognome: string;
  ruolo: Ruolo;
  ambulatorioId: string;
};

export function isRuolo(value: unknown): value is Ruolo {
  return typeof value === "string" && (RUOLI as readonly string[]).includes(value);
}

export async function createUserWithPassword(input: {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  ruolo: Ruolo;
  ambulatorioId: string;
}) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(input.password);
  const user = await ctx.internalAdapter.createUser(
    {
      email: input.email.toLowerCase(),
      name: input.nome,
      cognome: input.cognome,
      ruolo: input.ruolo,
      ambulatorioId: input.ambulatorioId,
    },
    { method: "admin" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    accountId: user.id,
    providerId: "credential",
    password: hash,
  });
  return user;
}

export async function setUserPassword(userId: string, password: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await ctx.internalAdapter.updatePassword(userId, hash);
  // Sign the user out everywhere so the old password's sessions stop working.
  await ctx.internalAdapter.deleteUserSessions(userId);
}

export async function deleteUserAccount(userId: string) {
  const ctx = await auth.$context;
  await ctx.internalAdapter.deleteUser(userId);
}
