import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { validateCodiceFiscale } from "../../shared/validators";

// Needs a disposable PostgreSQL database: every public table is emptied before the run.
const hasDb = !!process.env.DATABASE_URL;
const ORIGIN = "http://localhost:5000";

const ADMIN_A = { email: "anna@studio-a.test", password: "PasswordA-123" };
const STAFF_B = { email: "bruno@studio-b.test", password: "PasswordB-123" };

function codiceFiscale(prefix15: string): string {
  for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (validateCodiceFiscale(prefix15 + c)) return prefix15 + c;
  }
  throw new Error("unreachable");
}

function paziente(overrides: Record<string, unknown> = {}) {
  return {
    nome: "Mario",
    cognome: "Rossi",
    codiceFiscale: codiceFiscale("RSSMRA85M01H501"),
    dataNascita: "1985-08-01",
    luogoNascita: "Roma",
    sesso: "M",
    indirizzo: "Via Test 1",
    citta: "Roma",
    provincia: "RM",
    cap: "00100",
    telefono: "3330000000",
    ...overrides,
  };
}

describe.skipIf(!hasDb)("API: authentication and per-clinic isolation", () => {
  let app: Express;
  let closePool: () => Promise<void>;
  let createClinicWithUser: (email: string, password: string) => Promise<string>;

  const agent = () => request.agent(app);
  // The real sign-in rate limit stays on, so sessions are reused instead of signing in for every test.
  const sessions = new Map<string, ReturnType<typeof agent>>();
  async function signIn(email: string, password: string, { fresh = false } = {}) {
    const cached = sessions.get(email);
    if (cached && !fresh) return cached;
    const a = agent();
    const res = await a.post("/api/auth/sign-in/email").set("Origin", ORIGIN).send({ email, password });
    expect(res.status).toBe(200);
    sessions.set(email, a);
    return a;
  }

  beforeAll(async () => {
    const { db, pool } = await import("../../server/db");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder: "./migrations" });

    const { rows } = await pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    if (rows.length) {
      await pool.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(", ")} CASCADE`);
    }

    const { createApp } = await import("../../server/app");
    const { storage } = await import("../../server/storage");
    const { createUserWithPassword } = await import("../../server/auth");
    app = await createApp();
    closePool = () => pool.end();

    createClinicWithUser = async (email, password) => {
      const amb = await storage.createAmbulatorio({
        nome: "Studio B", indirizzo: "", citta: "", provincia: "", cap: "",
        telefono: "", email, piva: "", regione: "", specializzazione: "Medicina Generale",
      });
      await createUserWithPassword({
        email, password, nome: "Bruno", cognome: "Verdi", ruolo: "segreteria", ambulatorioId: amb.id,
      });
      return amb.id;
    };
  });

  afterAll(async () => {
    await closePool?.();
  });

  describe("first-run setup", () => {
    it("rejects requests without a session", async () => {
      expect((await agent().get("/api/me")).status).toBe(401);
      expect((await agent().get("/api/pazienti?ambulatorioId=x")).status).toBe(401);
    });

    it("validates and runs only once", async () => {
      expect((await agent().get("/api/setup/status")).body).toEqual({ needsSetup: true });

      const body = { nome: "Anna", cognome: "Bianchi", nomeAmbulatorio: "Studio A", ...ADMIN_A };
      expect((await agent().post("/api/setup").send({ ...body, password: "corta" })).status).toBe(400);
      expect((await agent().post("/api/setup").send(body)).status).toBe(201);
      expect((await agent().post("/api/setup").send({ ...body, email: "altro@x.test" })).status).toBe(409);
      expect((await agent().get("/api/setup/status")).body).toEqual({ needsSetup: false });
    });

    it("keeps public sign-up closed", async () => {
      const res = await agent()
        .post("/api/auth/sign-up/email")
        .set("Origin", ORIGIN)
        .send({ email: "intruso@x.test", password: "Password-123", name: "Intruso" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe("sign-in and roles", () => {
    it("rejects a wrong password", async () => {
      const res = await agent()
        .post("/api/auth/sign-in/email")
        .set("Origin", ORIGIN)
        .send({ email: ADMIN_A.email, password: "Sbagliata-123" });
      expect(res.status).toBe(401);
    });

    it("lets the admin build a team, and blocks non-admins", async () => {
      const admin = await signIn(ADMIN_A.email, ADMIN_A.password);
      expect((await admin.get("/api/me")).body.user.ruolo).toBe("admin");

      const segreteria = { nome: "Sara", cognome: "Neri", email: "sara@studio-a.test", password: "PasswordS-123", ruolo: "segreteria" };
      expect((await admin.post("/api/team").send(segreteria)).status).toBe(201);
      expect((await admin.post("/api/team").send(segreteria)).status).toBe(409);

      const sara = await signIn(segreteria.email, segreteria.password);
      expect((await sara.get("/api/team")).body).toHaveLength(2);
      expect((await sara.post("/api/team").send({ ...segreteria, email: "x@studio-a.test" })).status).toBe(403);
      expect((await sara.put("/api/subscription").send({ piano: "ENTERPRISE" })).status).toBe(403);
    });

    it("signs out every session when an admin resets a password", async () => {
      const admin = await signIn(ADMIN_A.email, ADMIN_A.password);
      const medico = { nome: "Luca", cognome: "Gialli", email: "luca@studio-a.test", password: "PasswordL-123", ruolo: "medico" };
      const { body: created } = await admin.post("/api/team").send(medico);

      const luca = await signIn(medico.email, medico.password);
      expect((await luca.get("/api/me")).status).toBe(200);

      expect((await admin.post(`/api/team/${created.id}/password`).send({ password: "NuovaPass-456" })).status).toBe(200);
      expect((await luca.get("/api/me")).status).toBe(401);
      await signIn(medico.email, "NuovaPass-456", { fresh: true });
    });

    it("ends the session on sign-out", async () => {
      const admin = await signIn(ADMIN_A.email, ADMIN_A.password, { fresh: true });
      await admin.post("/api/auth/sign-out").set("Origin", ORIGIN).send({});
      expect((await admin.get("/api/me")).status).toBe(401);
      sessions.delete(ADMIN_A.email);
    });
  });

  describe("isolation between clinics", () => {
    let clinicA: string;
    let clinicB: string;
    let pazienteA: string;
    let appuntamentoA: string;
    let staffBId: string;

    beforeAll(async () => {
      clinicB = await createClinicWithUser(STAFF_B.email, STAFF_B.password);
      const admin = await signIn(ADMIN_A.email, ADMIN_A.password);
      clinicA = (await admin.get("/api/me")).body.user.ambulatorioId;

      // A forged ambulatorioId in the body is replaced with the caller's own.
      const res = await admin.post("/api/pazienti").send({ ...paziente(), ambulatorioId: clinicB });
      expect(res.status).toBe(201);
      expect(res.body.ambulatorioId).toBe(clinicA);
      pazienteA = res.body.id;

      const apt = await admin
        .post("/api/appuntamenti")
        .send({ ambulatorioId: clinicA, pazienteId: pazienteA, dataOra: "2026-10-07T09:00:00.000Z", tipo: "visita" });
      expect(apt.status).toBe(201);
      appuntamentoA = apt.body.id;

      const bruno = await signIn(STAFF_B.email, STAFF_B.password);
      staffBId = (await bruno.get("/api/me")).body.user.id;
    });

    it("hides another clinic's patients", async () => {
      const b = await signIn(STAFF_B.email, STAFF_B.password);
      const list = await b.get(`/api/pazienti?ambulatorioId=${clinicA}`);
      expect(list.status).toBe(200);
      expect(list.body.pazienti).toHaveLength(0);

      expect((await b.get(`/api/pazienti/${pazienteA}`)).status).toBe(404);
      expect((await b.patch(`/api/pazienti/${pazienteA}`).send({ nome: "Modificato" })).status).toBe(404);
      expect((await b.delete(`/api/pazienti/${pazienteA}`)).status).toBe(404);
      expect((await b.get(`/api/pazienti/${pazienteA}/cartella-pdf`)).status).toBe(404);
      expect((await b.get(`/api/pazienti/codice-fiscale/${paziente().codiceFiscale}`)).status).toBe(404);
    });

    it("hides another clinic's appointments and blocks booking its patients", async () => {
      const b = await signIn(STAFF_B.email, STAFF_B.password);
      expect((await b.get(`/api/appuntamenti?ambulatorioId=${clinicA}&pazienteId=${pazienteA}`)).body).toEqual([]);
      expect((await b.get(`/api/appuntamenti/${appuntamentoA}`)).status).toBe(404);
      expect((await b.delete(`/api/appuntamenti/${appuntamentoA}`)).status).toBe(404);

      const booking = await b
        .post("/api/appuntamenti")
        .send({ ambulatorioId: clinicA, pazienteId: pazienteA, dataOra: "2026-10-08T09:00:00.000Z", tipo: "visita" });
      expect(booking.status).toBe(404);
    });

    it("hides another clinic's settings and staff", async () => {
      const b = await signIn(STAFF_B.email, STAFF_B.password);
      expect((await b.get(`/api/ambulatori/${clinicA}`)).status).toBe(404);
      const list = await b.get("/api/ambulatori-list");
      expect(list.body.map((x: { id: string }) => x.id)).toEqual([clinicB]);

      const admin = await signIn(ADMIN_A.email, ADMIN_A.password);
      expect((await admin.get(`/api/users/${staffBId}`)).status).toBe(404);
      expect((await admin.post(`/api/team/${staffBId}/password`).send({ password: "Rubata-12345" })).status).toBe(404);
      expect((await admin.delete(`/api/team/${staffBId}`)).status).toBe(404);
    });

    it("still serves the owning clinic", async () => {
      const admin = await signIn(ADMIN_A.email, ADMIN_A.password);
      expect((await admin.get(`/api/pazienti/${pazienteA}`)).status).toBe(200);
      expect((await admin.get(`/api/appuntamenti?ambulatorioId=x`)).body).toHaveLength(1);
    });
  });

  // Runs last: it exhausts the sign-in rate limit for the test client's IP.
  describe("brute-force protection", () => {
    it("throttles repeated sign-in attempts, even with forged forwarding headers", async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 12; i++) {
        const res = await agent()
          .post("/api/auth/sign-in/email")
          .set("Origin", ORIGIN)
          .set("X-Forwarded-For", `203.0.113.${i}`)
          .set("X-MedicoFlow-Client-IP", `198.51.100.${i}`)
          .send({ email: ADMIN_A.email, password: `Sbagliata-${i}` });
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
    });
  });
});
