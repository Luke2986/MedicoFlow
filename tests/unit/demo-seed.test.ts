import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { validateCodiceFiscale } from "../../shared/validators";

// Runs the app on the in-memory database, exactly as a deploy without DATABASE_URL does.
delete process.env.DATABASE_URL;
delete process.env.DEMO_DATA;

describe("demo mode (in-memory database)", () => {
  let app: Express;
  let db: typeof import("../../server/db").db;
  let schema: typeof import("../../shared/schema");
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    ({ db, closeDb } = await import("../../server/db"));
    schema = await import("../../shared/schema");
    const { createApp } = await import("../../server/app");
    app = await createApp();
  });

  afterAll(() => closeDb());

  it("fills the clinic with realistic sample data", async () => {
    const pazienti = await db.select().from(schema.pazienti);
    const appuntamenti = await db.select().from(schema.appuntamenti);
    const visite = await db.select().from(schema.visite);
    const users = await db.select().from(schema.users);

    expect(pazienti.length).toBeGreaterThanOrEqual(20);
    expect(appuntamenti.length).toBeGreaterThan(20);
    expect(visite.length).toBeGreaterThan(pazienti.length);
    expect(users.map((u) => u.ruolo).sort()).toEqual(["admin", "medico", "medico", "segreteria"]);
    for (const p of pazienti) expect(validateCodiceFiscale(p.codiceFiscale)).toBe(true);
  });

  it("never double-books a doctor", async () => {
    const appuntamenti = await db.select().from(schema.appuntamenti);
    const byMedico = new Map<string, { start: number; end: number }[]>();
    for (const a of appuntamenti) {
      const start = a.dataOra.getTime();
      const slots = byMedico.get(a.medicoId) ?? [];
      for (const s of slots) expect(start < s.end && s.start < start + a.durata * 60_000).toBe(false);
      slots.push({ start, end: start + a.durata * 60_000 });
      byMedico.set(a.medicoId, slots);
    }
  });

  it("lets a visitor in with one click, without exposing the password", async () => {
    const status = await request(app).get("/api/demo");
    expect(status.body).toEqual({ demo: true, hasDemoData: true });
    expect(JSON.stringify(status.body)).not.toMatch(/password/i);

    const agent = request.agent(app);
    expect((await agent.post("/api/demo/session")).status).toBe(200);
    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.user.ruolo).toBe("admin");
  });

  it("can start from scratch and bring the sample data back", async () => {
    const agent = request.agent(app);
    await agent.post("/api/demo/session");

    expect((await agent.post("/api/demo/reset").send({ mode: "empty" })).status).toBe(200);
    expect((await agent.get("/api/setup/status")).body).toEqual({ needsSetup: true });
    expect((await agent.get("/api/me")).status).toBe(401);
    expect((await db.select().from(schema.pazienti)).length).toBe(0);
    expect((await db.select().from(schema.specializations)).length).toBeGreaterThan(0);

    expect((await agent.post("/api/demo/reset").send({ mode: "demo" })).status).toBe(200);
    expect((await agent.get("/api/demo")).body.hasDemoData).toBe(true);
    expect((await db.select().from(schema.pazienti)).length).toBeGreaterThanOrEqual(20);
  });

  it("keeps a visitor signed in on another serverless instance", async () => {
    const agent = request.agent(app);
    await agent.post("/api/demo/session");
    const before = (await agent.get("/api/me")).body;

    // A different instance has rebuilt the same clinic from scratch: no session rows, same IDs.
    const { resetDemoDatabase } = await import("../../server/prepare-db");
    await resetDemoDatabase("demo");
    expect((await db.select().from(schema.session)).length).toBe(0);

    const after = await agent.get("/api/me");
    expect(after.status).toBe(200);
    expect(after.body.user.ambulatorioId).toBe(before.user.ambulatorioId);
    const pazienti = await agent.get(`/api/pazienti?ambulatorioId=${before.user.ambulatorioId}`);
    expect(pazienti.body.pagination.total).toBeGreaterThanOrEqual(20);
  });

  it("rejects an unknown reset mode", async () => {
    expect((await request(app).post("/api/demo/reset").send({ mode: "all" })).status).toBe(400);
  });
});
