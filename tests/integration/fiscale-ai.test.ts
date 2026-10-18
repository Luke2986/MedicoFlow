import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { generateKeyPairSync } from "node:crypto";
import { validateCodiceFiscale } from "../../shared/validators";

// Runs on the database in DATABASE_URL (emptied first) or, without it, on the in-memory PGlite database.
const ORIGIN = "http://localhost:5000";
const ADMIN = { email: "admin@studio-f.test", password: "PasswordA-123" };
const MEDICO = { email: "medico@studio-f.test", password: "PasswordM-123" };
const SEGRETERIA = { email: "segreteria@studio-f.test", password: "PasswordS-123" };
const ALTRO = { email: "altro@studio-g.test", password: "PasswordG-123" };
const CREDENZIALI = { utente: "UTENTE_TEST", password: "PasswordTS-segreta-987", pincode: "PIN-segreto-654" };

function codiceFiscale(prefix15: string): string {
  for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") if (validateCodiceFiscale(prefix15 + c)) return prefix15 + c;
  throw new Error("unreachable");
}
const CF_PAZIENTE = codiceFiscale("VRDLGU70A01F205");
const CF_MEDICO = codiceFiscale("BNCNNA75A41H501");

describe("informativa AI, fatture e Sistema TS", () => {
  let app: Express;
  let closePool: () => Promise<void>;
  const sessions = new Map<string, ReturnType<typeof request.agent>>();
  let pazienteId: string;
  let adminId: string;
  let medicoId: string;
  let pazienteAltroClinic: string;

  async function signIn(u: { email: string; password: string }) {
    const cached = sessions.get(u.email);
    if (cached) return cached;
    const a = request.agent(app);
    const res = await a.post("/api/auth/sign-in/email").set("Origin", ORIGIN).send(u);
    expect(res.status).toBe(200);
    sessions.set(u.email, a);
    return a;
  }

  beforeAll(async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    vi.stubEnv("DEMO_DATA", "false");
    const { closeDb } = await import("../../server/db");
    const { migrateDatabase, truncateAllTables } = await import("../../server/prepare-db");
    await migrateDatabase();
    await truncateAllTables();
    const { createApp } = await import("../../server/app");
    const { storage } = await import("../../server/storage");
    const { createUserWithPassword } = await import("../../server/auth");
    app = await createApp();
    closePool = closeDb;

    expect((await request(app).post("/api/setup").send({ nome: "Anna", cognome: "Bianchi", nomeAmbulatorio: "Studio F", ...ADMIN })).status).toBe(201);
    const admin = await signIn(ADMIN);
    adminId = (await admin.get("/api/me")).body.user.id;
    medicoId = (await admin.post("/api/team").send({ nome: "Marco", cognome: "Ferrari", ruolo: "medico", ...MEDICO })).body.id;
    expect((await admin.post("/api/team").send({ nome: "Sara", cognome: "Galli", ruolo: "segreteria", ...SEGRETERIA })).status).toBe(201);
    const p = await admin.post("/api/pazienti").send({
      nome: "Luigi", cognome: "Verdi", codiceFiscale: CF_PAZIENTE, dataNascita: "1970-01-01", luogoNascita: "Milano",
      sesso: "M", indirizzo: "Via Test 1", citta: "Milano", provincia: "MI", cap: "20100", telefono: "3330000000", ambulatorioId: "x",
    });
    expect(p.status).toBe(201);
    pazienteId = p.body.id;

    const amb = await storage.createAmbulatorio({
      nome: "Studio G", indirizzo: "", citta: "", provincia: "", cap: "", telefono: "", email: ALTRO.email,
      piva: "", regione: "", specializzazione: "Medicina Generale",
    });
    await createUserWithPassword({ ...ALTRO, nome: "Gino", cognome: "Rossi", ruolo: "admin", ambulatorioId: amb.id });
    const altro = await signIn(ALTRO);
    pazienteAltroClinic = (
      await altro.post("/api/pazienti").send({
        nome: "Ugo", cognome: "Neri", codiceFiscale: codiceFiscale("NREUGO60A01H501"), dataNascita: "1960-01-01",
        luogoNascita: "Roma", sesso: "M", indirizzo: "Via X", citta: "Roma", provincia: "RM", cap: "00100", telefono: "3331111111", ambulatorioId: "x",
      })
    ).body.id;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    await closePool?.();
  });

  describe("consenso AI", () => {
    const trascrivi = (a: ReturnType<typeof request.agent>, pid: string) =>
      a.post("/api/ai/transcribe").field("pazienteId", pid).attach("audio", Buffer.alloc(2048), { filename: "r.webm", contentType: "audio/webm" });

    it("blocks transcription without consent and writes an audit row", async () => {
      const admin = await signIn(ADMIN);
      const res = await trascrivi(admin, pazienteId);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CONSENSO_AI_MANCANTE");
      const audit = (await admin.get("/api/ai/audit")).body;
      expect(audit[0]).toMatchObject({ esito: "negato_consenso", pazienteNome: "Verdi Luigi", byteAudio: 2048 });
      expect(JSON.stringify(audit)).not.toMatch(/testo|text/i);
    });

    it("treats a refusal like a missing consent, and lets the gate pass after consent", async () => {
      const segreteria = await signIn(SEGRETERIA);
      expect((await segreteria.post(`/api/pazienti/${pazienteId}/consenso-ai`).send({ consensoRegistrazione: false })).status).toBe(201);
      const admin = await signIn(ADMIN);
      expect((await trascrivi(admin, pazienteId)).status).toBe(403);

      expect((await segreteria.post(`/api/pazienti/${pazienteId}/consenso-ai`).send({ consensoRegistrazione: true })).status).toBe(201);
      const stato = (await admin.get(`/api/pazienti/${pazienteId}/consenso-ai`)).body;
      expect(stato.consenso.consensoRegistrazione).toBe(true);
      expect((await trascrivi(admin, pazienteId)).status).not.toBe(403);

      expect((await admin.post(`/api/pazienti/${pazienteId}/consenso-ai/revoca`)).status).toBe(204);
      expect((await admin.get(`/api/pazienti/${pazienteId}/consenso-ai`)).body.consenso).toBeNull();
      expect((await trascrivi(admin, pazienteId)).status).toBe(403);
    });

    it("hides other clinics' patients and keeps the audit log for admins", async () => {
      const admin = await signIn(ADMIN);
      expect((await trascrivi(admin, pazienteAltroClinic)).status).toBe(404);
      expect((await admin.get(`/api/pazienti/${pazienteAltroClinic}/consenso-ai`)).status).toBe(404);
      expect((await admin.post(`/api/pazienti/${pazienteAltroClinic}/consenso-ai`).send({ consensoRegistrazione: true })).status).toBe(404);
      expect((await (await signIn(SEGRETERIA)).get("/api/ai/audit")).status).toBe(403);
      const altro = await signIn(ALTRO);
      expect((await altro.get("/api/ai/audit")).body).toEqual([]);
    });
  });

  describe("referto AI", () => {
    const DETTATURA = "Anamnesi: dolore toracico atipico da due giorni. Esame obiettivo: pressione 150 su 95. Diagnosi: dolore toracico non cardiaco.";

    it("structures a dictation only with consent, without an AI key, and never logs the text", async () => {
      const admin = await signIn(ADMIN);
      const log = vi.spyOn(console, "log");
      const err = vi.spyOn(console, "error");
      expect((await admin.get("/api/ai/stato")).body).toEqual({ trascrizione: false, strutturazione: "regole", simulazione: false });

      const negato = await admin.post("/api/ai/referto").send({ pazienteId, testo: DETTATURA });
      expect(negato.status).toBe(403);
      expect(negato.body.code).toBe("CONSENSO_AI_MANCANTE");

      expect((await admin.post(`/api/pazienti/${pazienteId}/consenso-ai`).send({ consensoRegistrazione: true })).status).toBe(201);
      const ok = await admin.post("/api/ai/referto").send({ pazienteId, testo: DETTATURA });
      expect(ok.status).toBe(200);
      expect(ok.body.motore).toBe("regole");
      expect(ok.body.campi).toMatchObject({
        anamnesi: "dolore toracico atipico da due giorni.",
        diagnosi: "dolore toracico non cardiaco.",
        pressioneSistolica: 150,
        pressioneDiastolica: 95,
        terapia: "",
      });

      expect((await admin.post("/api/ai/referto").send({ pazienteId: pazienteAltroClinic, testo: DETTATURA })).status).toBe(404);

      const audit = (await admin.get("/api/ai/audit")).body;
      expect(audit.slice(0, 2).map((r: { azione: string; esito: string }) => `${r.azione}:${r.esito}`)).toEqual(["strutturazione:ok", "strutturazione:negato_consenso"]);
      expect(audit[0]).toMatchObject({ provider: "locale", modello: "regole-v1", byteAudio: null });
      const scritto = [...log.mock.calls, ...err.mock.calls].flat().map(String).join("\n");
      expect(scritto).not.toContain("toracico");
      expect(JSON.stringify(audit)).not.toContain("toracico");
      log.mockRestore();
      err.mockRestore();
    });

    it("saves AI-proposed fields only after the review is confirmed", async () => {
      const admin = await signIn(ADMIN);
      const visita = (referto: Record<string, unknown>) =>
        admin.post("/api/visite").send({
          pazienteId, ambulatorioId: "x", dataVisita: "2026-10-18T09:00:00.000Z", motivoVisita: "Dolore toracico",
          diagnosi: "Dolore toracico non cardiaco", referto,
        });
      const rifiutata = await visita({ daAi: true, motore: "regole", revisioneConfermata: false });
      expect(rifiutata.status).toBe(400);
      expect(rifiutata.body.error).toMatch(/Conferma/);

      const salvata = await visita({ daAi: true, motore: "regole", revisioneConfermata: true });
      expect(salvata.status).toBe(201);
      expect(salvata.body).not.toHaveProperty("referto");
      const audit = (await admin.get("/api/ai/audit")).body;
      expect(audit[0]).toMatchObject({ azione: "conferma_referto", esito: "ok", pazienteNome: "Verdi Luigi" });

      const patch = await admin.patch(`/api/visite/${salvata.body.id}`).send({ terapia: "Riposo", referto: { daAi: true } });
      expect(patch.status).toBe(400);
    });
  });

  describe("fatture", () => {
    const fattura =(overrides: Record<string, unknown> = {}) => ({
      pazienteId,
      dataEmissione: "2026-10-18",
      dataPagamento: "2026-10-18",
      metodoPagamento: "pos",
      voci: [{ tipoSpesa: "SR", descrizione: "Visita", importoCentesimi: 12000 }],
      ...overrides,
    });

    it("requires the doctor's fiscal data, then numbers per doctor and year", async () => {
      const medico = await signIn(MEDICO);
      const senzaDati = await medico.post("/api/documenti-spesa").send(fattura());
      expect(senzaDati.status).toBe(400);
      expect(senzaDati.body.error).toMatch(/Marco Ferrari/);

      expect((await medico.put(`/api/team/${adminId}/fiscale`).send({ codiceFiscale: CF_MEDICO, partitaIva: "12345678901", regimeFiscale: null, naturaIvaDefault: "N4" })).status).toBe(403);
      expect((await medico.put(`/api/team/${medicoId}/fiscale`).send({ codiceFiscale: "NONVALIDO", partitaIva: "12345678901", regimeFiscale: null, naturaIvaDefault: "N4" })).status).toBe(400);
      expect((await medico.put(`/api/team/${medicoId}/fiscale`).send({ codiceFiscale: CF_MEDICO, partitaIva: "12345678901", regimeFiscale: "ordinario", naturaIvaDefault: "N4" })).status).toBe(200);

      const uno = await medico.post("/api/documenti-spesa").send(fattura());
      const due = await medico.post("/api/documenti-spesa").send(fattura({ voci: [{ tipoSpesa: "SR", descrizione: "Controllo", importoCentesimi: 5000 }], metodoPagamento: "contanti", flagOpposizione: true }));
      expect([uno.status, due.status]).toEqual([201, 201]);
      expect([uno.body.numero, due.body.numero]).toEqual([1, 2]);
      expect(uno.body).toMatchObject({ bollo: true, naturaIva: "N4", cfPaziente: CF_PAZIENTE, cfEmittente: CF_MEDICO, statoTs: "da_inviare" });
      expect(due.body.bollo).toBe(false);
    });

    it("lets a doctor issue only in their own name, and the front desk on behalf of a doctor", async () => {
      const medico = await signIn(MEDICO);
      expect((await medico.post("/api/documenti-spesa").send(fattura({ emittenteId: adminId }))).status).toBe(403);
      const segreteria = await signIn(SEGRETERIA);
      const res = await segreteria.post("/api/documenti-spesa").send(fattura({ emittenteId: medicoId }));
      expect(res.status).toBe(201);
      expect(res.body.numero).toBe(3);
      const daSegreteria = await segreteria.get(`/api/team/${medicoId}/fiscale`);
      expect(daSegreteria.status).toBe(403);
    });

    it("refuses deleting anything but the latest invoice, and serves the PDF", async () => {
      const medico = await signIn(MEDICO);
      const docs = (await medico.get("/api/documenti-spesa?anno=2026").query({ emittenteId: medicoId })).body;
      const primo = docs.find((d: { numero: number }) => d.numero === 1);
      const ultimo = docs.find((d: { numero: number }) => d.numero === 3);
      expect((await medico.delete(`/api/documenti-spesa/${primo.id}`)).status).toBe(409);
      expect((await (await signIn(SEGRETERIA)).delete(`/api/documenti-spesa/${ultimo.id}`)).status).toBe(403);
      expect((await medico.delete(`/api/documenti-spesa/${ultimo.id}`)).status).toBe(204);
      const pdf = await medico.get(`/api/documenti-spesa/${primo.id}/pdf`);
      expect(pdf.status).toBe(200);
      expect(pdf.headers["content-type"]).toBe("application/pdf");
    });

    it("hides invoices from other clinics", async () => {
      const altro = await signIn(ALTRO);
      const admin = await signIn(ADMIN);
      const [doc] = (await admin.get("/api/documenti-spesa")).body;
      expect((await altro.get("/api/documenti-spesa")).body).toEqual([]);
      expect((await altro.get(`/api/documenti-spesa/${doc.id}`)).status).toBe(404);
      expect((await altro.get(`/api/documenti-spesa/${doc.id}/pdf`)).status).toBe(404);
      expect((await altro.patch(`/api/documenti-spesa/${doc.id}`).send({ escluso: true })).status).toBe(404);
      expect((await altro.post("/api/sistema-ts/invia").send({ credenziali: CREDENZIALI, documentoIds: [doc.id] })).status).toBe(404);
      expect((await altro.get(`/api/team/${medicoId}/fiscale`)).status).toBe(404);
    });
  });

  describe("invio Sistema TS", () => {
    it("refuses to send without the encryption certificate", async () => {
      const medico = await signIn(MEDICO);
      const [doc] = (await medico.get("/api/documenti-spesa")).body;
      const res = await medico.post("/api/sistema-ts/invia").send({ credenziali: CREDENZIALI, documentoIds: [doc.id] });
      expect(res.status).toBe(503);
      expect((await medico.get("/api/sistema-ts/stato")).body).toMatchObject({ ambiente: "test", certificatoConfigurato: false });
    });

    it("sends encrypted data, records the outcome and never leaks credentials", async () => {
      const { impostaChiaveTs } = await import("../../server/ts/cifratura");
      impostaChiaveTs(generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey);
      const corpi: string[] = [];
      const fetchFinto = vi.fn(async (_url: string, init: RequestInit) => {
        corpi.push(String(init.body));
        return new Response(
          "<Envelope><Body><esitoChiamata>0</esitoChiamata><protocollo>26101800000000001</protocollo><listaMessaggi/></Body></Envelope>",
          { status: 200 },
        );
      });
      vi.stubGlobal("fetch", fetchFinto);
      const log = vi.spyOn(console, "log");
      const err = vi.spyOn(console, "error");

      const segreteria = await signIn(SEGRETERIA);
      const medico = await signIn(MEDICO);
      const docs = (await medico.get("/api/documenti-spesa")).body as { id: string; flagOpposizione: boolean }[];
      expect((await segreteria.post("/api/sistema-ts/invia").send({ credenziali: CREDENZIALI, documentoIds: docs.map((d) => d.id) })).status).toBe(403);

      const res = await medico.post("/api/sistema-ts/invia").send({ credenziali: CREDENZIALI, documentoIds: docs.map((d) => d.id) });
      expect(res.status).toBe(200);
      expect(res.body.risultati).toHaveLength(2);
      expect(res.body.risultati.every((r: { statoTs: string }) => r.statoTs === "inviato")).toBe(true);
      expect(fetchFinto).toHaveBeenCalledTimes(2);

      const tutto = JSON.stringify(res.body) + corpi.join("") + JSON.stringify([...log.mock.calls, ...err.mock.calls]);
      for (const segreto of [CREDENZIALI.password, CREDENZIALI.pincode, CF_PAZIENTE, CF_MEDICO]) expect(tutto).not.toContain(segreto);
      expect(corpi.some((c) => !c.includes("cfCittadino"))).toBe(true);

      const dopo = (await medico.get("/api/documenti-spesa")).body;
      expect(dopo.every((d: { statoTs: string; protocolloTs: string }) => d.statoTs === "inviato" && d.protocolloTs === "26101800000000001")).toBe(true);
      expect((await medico.patch(`/api/documenti-spesa/${dopo[0].id}`).send({ escluso: true })).status).toBe(409);
      expect((await medico.delete(`/api/documenti-spesa/${dopo[0].id}`)).status).toBe(409);
      expect((await medico.post("/api/sistema-ts/invia").send({ credenziali: CREDENZIALI, documentoIds: [dopo[0].id] })).status).toBe(409);

      log.mockRestore();
      err.mockRestore();
      impostaChiaveTs(null);
    });
  });
});
