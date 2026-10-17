import { createHash, randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { auth } from "../auth";
import {
  account,
  ambulatori,
  appuntamenti,
  onboardingProgress,
  pazienti,
  specializations,
  subscriptions,
  users,
  visite,
  type Ruolo,
} from "../../shared/schema";
import { PLANS } from "../../shared/features";
import { buildCodiceFiscale } from "./codice-fiscale";

// Every name, address, phone number and clinical record below is invented.

type Condizione =
  | "ipertensione" | "diabete" | "bpco" | "lombalgia" | "gastrite"
  | "cefalea" | "fibrillazione" | "ipotiroidismo" | "asma" | "controllo";

type PazienteDemo = {
  nome: string;
  cognome: string;
  sesso: "M" | "F";
  nascita: string;
  luogo: string;
  comune: string;
  indirizzo: string;
  citta: string;
  cap: string;
  telefono: string;
  email?: string;
  allergie?: string[];
  note?: string;
  condizione: Condizione;
};

const PAZIENTI: PazienteDemo[] = [
  { nome: "Giuseppe", cognome: "Brambilla", sesso: "M", nascita: "1952-03-14", luogo: "Milano", comune: "F205", indirizzo: "Via Ripamonti 201", citta: "Milano", cap: "20141", telefono: "347 812 4590", allergie: ["Penicillina"], note: "Vive con la moglie, autonomo. Ex fumatore (40 pack-years).", condizione: "bpco" },
  { nome: "Maria Grazia", cognome: "Colombo", sesso: "F", nascita: "1958-11-02", luogo: "Monza", comune: "F704", indirizzo: "Viale Ortles 12", citta: "Milano", cap: "20139", telefono: "339 204 7781", email: "mg.colombo58@example.it", condizione: "ipertensione" },
  { nome: "Luca", cognome: "Bianchi", sesso: "M", nascita: "1981-07-23", luogo: "Bergamo", comune: "A794", indirizzo: "Via Tito Livio 7", citta: "Milano", cap: "20137", telefono: "328 551 0934", email: "luca.bianchi81@example.it", condizione: "lombalgia" },
  { nome: "Francesca", cognome: "Rinaldi", sesso: "F", nascita: "1990-02-09", luogo: "Napoli", comune: "F839", indirizzo: "Corso Lodi 88", citta: "Milano", cap: "20139", telefono: "320 778 1450", email: "f.rinaldi@example.it", allergie: ["Nichel"], condizione: "cefalea" },
  { nome: "Antonio", cognome: "Esposito", sesso: "M", nascita: "1947-05-30", luogo: "Napoli", comune: "F839", indirizzo: "Via Bessarione 25", citta: "Milano", cap: "20139", telefono: "02 5730 4412", allergie: ["Acido acetilsalicilico"], note: "In terapia anticoagulante: controllo INR mensile.", condizione: "fibrillazione" },
  { nome: "Giulia", cognome: "Moretti", sesso: "F", nascita: "1995-09-18", luogo: "Milano", comune: "F205", indirizzo: "Via Spadolini 3", citta: "Milano", cap: "20141", telefono: "331 905 2276", email: "giulia.moretti95@example.it", allergie: ["Graminacee", "Acari della polvere"], condizione: "asma" },
  { nome: "Roberto", cognome: "Galli", sesso: "M", nascita: "1963-12-01", luogo: "Brescia", comune: "B157", indirizzo: "Via Noto 14", citta: "Milano", cap: "20141", telefono: "348 667 3021", condizione: "diabete" },
  { nome: "Anna", cognome: "Ferraro", sesso: "F", nascita: "1971-04-26", luogo: "Bari", comune: "A662", indirizzo: "Via Bazzi 52", citta: "Milano", cap: "20141", telefono: "349 120 8865", email: "anna.ferraro71@example.it", condizione: "ipotiroidismo" },
  { nome: "Paolo", cognome: "Conti", sesso: "M", nascita: "1975-08-11", luogo: "Torino", comune: "L219", indirizzo: "Via Ferrieri 9", citta: "Milano", cap: "20141", telefono: "335 402 9917", condizione: "gastrite" },
  { nome: "Elisa", cognome: "Marchetti", sesso: "F", nascita: "1986-01-15", luogo: "Bologna", comune: "A944", indirizzo: "Via Agilulfo 4", citta: "Milano", cap: "20135", telefono: "340 556 2318", email: "elisa.marchetti@example.it", allergie: ["Lattosio"], condizione: "controllo" },
  { nome: "Franco", cognome: "Villa", sesso: "M", nascita: "1949-10-07", luogo: "Sesto San Giovanni", comune: "I690", indirizzo: "Via Boifava 31", citta: "Milano", cap: "20142", telefono: "02 8461 2290", note: "Accompagnato dalla figlia alle visite.", condizione: "ipertensione" },
  { nome: "Silvia", cognome: "Lombardi", sesso: "F", nascita: "1966-06-21", luogo: "Pavia", comune: "G388", indirizzo: "Via Montegani 18", citta: "Milano", cap: "20141", telefono: "333 781 4402", condizione: "diabete" },
  { nome: "Davide", cognome: "Fontana", sesso: "M", nascita: "1999-03-03", luogo: "Como", comune: "C933", indirizzo: "Via Gola 11", citta: "Milano", cap: "20143", telefono: "366 214 9083", email: "davide.fontana99@example.it", condizione: "controllo" },
  { nome: "Rosa", cognome: "Caruso", sesso: "F", nascita: "1944-12-24", luogo: "Palermo", comune: "G273", indirizzo: "Via Palmieri 6", citta: "Milano", cap: "20141", telefono: "02 8954 1127", allergie: ["Sulfamidici"], note: "Deambulazione con bastone. Preferisce appuntamenti al mattino.", condizione: "ipertensione" },
  { nome: "Matteo", cognome: "Ricci", sesso: "M", nascita: "1988-05-12", luogo: "Firenze", comune: "D612", indirizzo: "Via Lampedusa 13", citta: "Milano", cap: "20141", telefono: "347 330 6618", email: "matteo.ricci88@example.it", condizione: "lombalgia" },
  { nome: "Chiara", cognome: "Gallo", sesso: "F", nascita: "1979-09-29", luogo: "Varese", comune: "L682", indirizzo: "Via Ascanio Sforza 47", citta: "Milano", cap: "20136", telefono: "338 902 5546", condizione: "gastrite" },
  { nome: "Stefano", cognome: "Mariani", sesso: "M", nascita: "1958-02-17", luogo: "Lodi", comune: "E648", indirizzo: "Via dei Missaglia 97", citta: "Milano", cap: "20142", telefono: "339 645 7720", allergie: ["Penicillina"], condizione: "fibrillazione" },
  { nome: "Laura", cognome: "Pellegrini", sesso: "F", nascita: "1983-07-08", luogo: "Cremona", comune: "D150", indirizzo: "Via Verro 22", citta: "Milano", cap: "20141", telefono: "329 457 1183", email: "laura.pellegrini@example.it", condizione: "cefalea" },
  { nome: "Giorgio", cognome: "Barbieri", sesso: "M", nascita: "1954-11-19", luogo: "Rho", comune: "H264", indirizzo: "Via Selvanesco 15", citta: "Milano", cap: "20141", telefono: "02 5739 0081", condizione: "bpco" },
  { nome: "Martina", cognome: "Sala", sesso: "F", nascita: "2001-04-04", luogo: "Milano", comune: "F205", indirizzo: "Via Chiesa Rossa 64", citta: "Milano", cap: "20142", telefono: "351 228 0476", email: "martina.sala01@example.it", allergie: ["Pollini di betulla"], condizione: "asma" },
  { nome: "Alessandro", cognome: "Testa", sesso: "M", nascita: "1969-01-27", luogo: "Lecce", comune: "E506", indirizzo: "Via Val di Sole 8", citta: "Milano", cap: "20141", telefono: "347 902 3365", condizione: "diabete" },
  { nome: "Valentina", cognome: "Rossetti", sesso: "F", nascita: "1992-10-30", luogo: "Cinisello Balsamo", comune: "C707", indirizzo: "Via Antonini 30", citta: "Milano", cap: "20141", telefono: "340 118 7294", email: "vale.rossetti@example.it", condizione: "ipotiroidismo" },
  { nome: "Carlo", cognome: "De Luca", sesso: "M", nascita: "1961-08-05", luogo: "Roma", comune: "H501", indirizzo: "Via Giuseppe Ripamonti 330", citta: "Milano", cap: "20141", telefono: "335 671 4408", condizione: "ipertensione" },
  { nome: "Beatrice", cognome: "Fumagalli", sesso: "F", nascita: "1974-03-22", luogo: "Monza", comune: "F704", indirizzo: "Via Quaranta 41", citta: "Milano", cap: "20139", telefono: "348 559 0137", allergie: ["FANS"], condizione: "lombalgia" },
];

type QuadroClinico = {
  motivo: string;
  anamnesi: string;
  esameObiettivo: string;
  diagnosi: string;
  terapia: string;
  esami?: string;
  pressione: [number, number];
  fc: number;
  temperatura?: number;
};

const QUADRI: Record<Condizione, QuadroClinico> = {
  ipertensione: {
    motivo: "Controllo pressorio periodico",
    anamnesi: "Ipertensione arteriosa nota da alcuni anni. Riferisce buona aderenza alla terapia. Nega cefalea, dolore toracico o dispnea.",
    esameObiettivo: "Toni cardiaci validi, ritmici, pause libere. Murmure vescicolare fisiologico. Assenza di edemi declivi.",
    diagnosi: "Ipertensione arteriosa essenziale (I10)",
    terapia: "Ramipril 5 mg 1 cp al mattino. Riduzione del sale nella dieta, attività fisica aerobica moderata.",
    esami: "Creatinina, elettroliti, profilo lipidico",
    pressione: [142, 88],
    fc: 74,
  },
  diabete: {
    motivo: "Controllo diabete e revisione emoglobina glicata",
    anamnesi: "Diabete mellito tipo 2 in trattamento orale. Glicemie domiciliari a digiuno tra 120 e 150 mg/dl. Nega episodi ipoglicemici.",
    esameObiettivo: "Buone condizioni generali. Polsi periferici presenti. Sensibilità vibratoria conservata ai piedi.",
    diagnosi: "Diabete mellito tipo 2 (E11)",
    terapia: "Metformina 1000 mg 1 cp a pranzo e 1 cp a cena. Dieta ipoglucidica. Controllo HbA1c fra 3 mesi.",
    esami: "Emoglobina glicata, glicemia, microalbuminuria, fondo oculare",
    pressione: [134, 82],
    fc: 78,
  },
  bpco: {
    motivo: "Dispnea da sforzo e tosse mattutina",
    anamnesi: "BPCO nota, ex fumatore. Riferisce tosse produttiva al risveglio e dispnea per sforzi moderati. Nessuna riacutizzazione negli ultimi 6 mesi.",
    esameObiettivo: "Murmure vescicolare ridotto diffusamente, sibili espiratori sparsi. Saturazione in aria ambiente 94%.",
    diagnosi: "BPCO (J44)",
    terapia: "Tiotropio 2,5 mcg 2 inalazioni al giorno. Vaccinazione antinfluenzale e antipneumococcica consigliate.",
    esami: "Spirometria con test di broncodilatazione, Rx torace",
    pressione: [136, 84],
    fc: 82,
  },
  lombalgia: {
    motivo: "Dolore lombare",
    anamnesi: "Dolore lombare insorto dopo sforzo da circa 10 giorni, senza irradiazione agli arti inferiori. Nega disturbi sfinterici.",
    esameObiettivo: "Contrattura della muscolatura paravertebrale lombare. Lasègue negativo bilateralmente. Forza e riflessi conservati.",
    diagnosi: "Lombalgia (M54.5)",
    terapia: "Paracetamolo 1 g al bisogno fino a 3 volte al giorno. Calore locale. Esercizi di mobilizzazione, evitare il riposo prolungato.",
    pressione: [124, 78],
    fc: 70,
  },
  gastrite: {
    motivo: "Bruciore epigastrico",
    anamnesi: "Bruciore epigastrico post-prandiale da circa 3 settimane, peggiorato dal caffè. Nega calo ponderale, vomito o melena.",
    esameObiettivo: "Addome trattabile, lievemente dolente alla palpazione profonda in epigastrio. Peristalsi presente.",
    diagnosi: "Gastrite (K29)",
    terapia: "Pantoprazolo 20 mg 1 cp a digiuno per 4 settimane. Evitare alcol, caffè e pasti abbondanti serali.",
    esami: "Ricerca Helicobacter pylori (breath test)",
    pressione: [122, 76],
    fc: 72,
  },
  cefalea: {
    motivo: "Cefalea ricorrente",
    anamnesi: "Cefalea gravativa bitemporale, 2-3 episodi a settimana, correlata a periodi di stress lavorativo. Nessun segno di allarme.",
    esameObiettivo: "Esame neurologico nella norma. Dolorabilità dei muscoli pericranici.",
    diagnosi: "Cefalea tensiva (R51)",
    terapia: "Ibuprofene 400 mg al bisogno (massimo 2 al giorno). Diario della cefalea, igiene del sonno.",
    pressione: [118, 74],
    fc: 68,
  },
  fibrillazione: {
    motivo: "Controllo fibrillazione atriale e terapia anticoagulante",
    anamnesi: "Fibrillazione atriale permanente in terapia anticoagulante. Riferisce occasionali palpitazioni, nessun sanguinamento.",
    esameObiettivo: "Toni cardiaci aritmici, frequenza controllata. Non edemi declivi.",
    diagnosi: "Fibrillazione atriale (I48)",
    terapia: "Prosegue apixaban 5 mg 1 cp due volte al giorno e bisoprololo 2,5 mg al mattino.",
    esami: "Emocromo, funzionalità renale, ECG",
    pressione: [128, 80],
    fc: 84,
  },
  ipotiroidismo: {
    motivo: "Controllo funzionalità tiroidea",
    anamnesi: "Ipotiroidismo in terapia sostitutiva. Riferisce lieve astenia. Nessuna variazione di peso significativa.",
    esameObiettivo: "Tiroide non palpabile. Cute normoidratata. Riflessi osteotendinei normoevocabili.",
    diagnosi: "Ipotiroidismo (E03.9)",
    terapia: "Levotiroxina 75 mcg a digiuno, 30 minuti prima della colazione.",
    esami: "TSH, FT4",
    pressione: [120, 76],
    fc: 66,
  },
  asma: {
    motivo: "Tosse notturna e respiro sibilante",
    anamnesi: "Asma allergico noto. Peggioramento stagionale con tosse notturna e sibili, uso del broncodilatatore al bisogno 3-4 volte a settimana.",
    esameObiettivo: "Sibili espiratori sparsi, buona ventilazione. Saturazione 97%.",
    diagnosi: "Asma bronchiale (J45)",
    terapia: "Budesonide/formoterolo 160/4,5 mcg 1 inalazione due volte al giorno. Antistaminico nei mesi di pollinazione.",
    esami: "Spirometria, test allergologici cutanei",
    pressione: [116, 72],
    fc: 76,
  },
  controllo: {
    motivo: "Visita di controllo generale",
    anamnesi: "Nessun disturbo in atto. Attività fisica regolare, non fumatore. Richiede controllo generale ed esami di routine.",
    esameObiettivo: "Obiettività cardiopolmonare e addominale nella norma.",
    diagnosi: "Visita generale in soggetto senza disturbi (Z00.0)",
    terapia: "Nessuna terapia. Stile di vita sano.",
    esami: "Emocromo, glicemia, profilo lipidico, esame urine",
    pressione: [118, 74],
    fc: 64,
  },
};

const STAFF: { nome: string; cognome: string; email: string; ruolo: Ruolo }[] = [
  { nome: "Chiara", cognome: "Fontana", email: "chiara.fontana@santalucia.demo", ruolo: "admin" },
  { nome: "Marco", cognome: "Ferrari", email: "marco.ferrari@santalucia.demo", ruolo: "medico" },
  { nome: "Elena", cognome: "Colombo", email: "elena.colombo@santalucia.demo", ruolo: "medico" },
  { nome: "Sara", cognome: "Galli", email: "sara.galli@santalucia.demo", ruolo: "segreteria" },
];

// Deterministic pseudo-random sequence, so every reset produces the same clinic.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * IDs derived from a fixed key: every serverless instance builds the same clinic with the same IDs,
 * so a session started on one instance keeps working when the next request lands on another.
 */
function stableId(key: string) {
  const h = createHash("sha256").update(`medicoflow-demo:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function seededRand(key: string) {
  return mulberry32(parseInt(createHash("sha256").update(key).digest("hex").slice(0, 8), 16));
}

const TIME_ZONE = "Europe/Rome";

function romeParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    year: +get("year"), month: +get("month") - 1, day: +get("day"),
    hour: +get("hour"), minute: +get("minute"), weekday: get("weekday"),
  };
}

/** The clinic is in Italy: appointment times are wall-clock times in Rome, whatever the server time zone. */
function romeTime(year: number, month: number, day: number, hour: number, minute: number) {
  const guess = Date.UTC(year, month, day, hour, minute);
  const p = romeParts(new Date(guess));
  const offset = Date.UTC(p.year, p.month, p.day, p.hour, p.minute) - guess;
  return new Date(guess - offset);
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS: [number, number][] = [[8, 30], [9, 30], [10, 30], [11, 30], [12, 30], [14, 30], [15, 30], [16, 30], [17, 30]];

let demoLogin: { email: string; password: string } | null = null;

/** Credentials of the demo admin, known only to this process. */
export function getDemoLogin() {
  return demoLogin;
}

export function clearDemoLogin() {
  demoLogin = null;
}

export async function seedDemo() {
  const rand = mulberry32(20241017);
  const pick = <T>(items: readonly T[]) => items[Math.floor(rand() * items.length)];

  const [medicinaGenerale] = await db.select().from(specializations).where(eq(specializations.slug, "medicina-generale"));

  const [ambulatorio] = await db.insert(ambulatori).values({
    id: stableId("ambulatorio"),
    nome: "Poliambulatorio Santa Lucia",
    indirizzo: "Via Giuseppe Ripamonti 118",
    citta: "Milano",
    provincia: "MI",
    cap: "20141",
    telefono: "02 5521 3480",
    email: "segreteria@santalucia.demo",
    piva: "09876543210",
    regione: "Lombardia",
    specializzazione: "Medicina Generale",
    specializationId: medicinaGenerale?.id,
  }).returning();

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 21);
  await db.insert(subscriptions).values({
    ambulatorioId: ambulatorio.id,
    piano: "PROFESSIONAL",
    status: "TRIAL",
    prezzoMensile: PLANS.PROFESSIONAL.price * 100,
    features: [...PLANS.PROFESSIONAL.features],
    dataFine: trialEnd,
  });

  await db.insert(onboardingProgress).values({
    ambulatorioId: ambulatorio.id,
    profileCompleted: true,
    firstPatientAdded: true,
    firstAppointmentAdded: true,
    themeCustomized: true,
    onboardingCompleted: true,
    completedAt: new Date(),
  });

  // One shared password, hashed once: hashing is the slowest step of a cold start.
  const password = randomBytes(18).toString("base64url");
  const hash = await (await auth.$context).password.hash(password);
  const staff = await db.insert(users).values(STAFF.map((s) => ({
    id: stableId(`user:${s.email}`),
    email: s.email,
    nome: s.nome,
    cognome: s.cognome,
    ruolo: s.ruolo,
    ambulatorioId: ambulatorio.id,
    emailVerified: true,
  }))).returning();
  await db.insert(account).values(staff.map((u) => ({
    id: stableId(`account:${u.email}`),
    accountId: u.id,
    providerId: "credential",
    userId: u.id,
    password: hash,
  })));
  demoLogin = { email: STAFF[0].email, password };
  const medici = staff.filter((u) => u.ruolo !== "segreteria");

  const createdPazienti = await db.insert(pazienti).values(PAZIENTI.map((p, i) => {
    const dataNascita = new Date(`${p.nascita}T00:00:00Z`);
    // Most patients have been registered for a while; the last two arrived this week.
    const giorniFa = i >= PAZIENTI.length - 2 ? 1 + i % 3 : 250 + Math.floor(rand() * 900);
    const createdAt = new Date(Date.now() - giorniFa * 86_400_000);
    return {
      id: stableId(`paziente:${i}`),
      createdAt,
      updatedAt: createdAt,
      nome: p.nome,
      cognome: p.cognome,
      codiceFiscale: buildCodiceFiscale({ nome: p.nome, cognome: p.cognome, dataNascita, sesso: p.sesso, codiceComune: p.comune }),
      dataNascita,
      luogoNascita: p.luogo,
      sesso: p.sesso,
      indirizzo: p.indirizzo,
      citta: p.citta,
      provincia: "MI",
      cap: p.cap,
      telefono: p.telefono,
      email: p.email ?? null,
      allergie: p.allergie ?? null,
      note: p.note ?? null,
      ambulatorioId: ambulatorio.id,
    };
  })).returning();
  const condizioneDi = new Map(createdPazienti.map((p, i) => [p.id, PAZIENTI[i].condizione]));

  // Appointments: current and next week, Monday to Saturday morning, on non-overlapping hourly slots.
  const now = new Date();
  const today = romeParts(now);
  const monday = new Date(Date.UTC(today.year, today.month, today.day - WEEKDAYS.indexOf(today.weekday)));
  const appuntamentiRows: (typeof appuntamenti.$inferInsert)[] = [];
  for (let d = 0; d < 13; d++) {
    if (d % 7 === 6) continue;
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + d);
    // Saturday: morning only.
    const daySlots = d % 7 === 5 ? SLOTS.slice(0, 4) : SLOTS;
    for (const medico of medici) {
      const slots = daySlots.filter(() => rand() < 0.45);
      for (const [hour, minute] of slots) {
        const paziente = pick(createdPazienti);
        const dataOra = romeTime(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute);
        const passato = dataOra < now;
        const tipo = pick(["controllo", "controllo", "controllo", "prima-visita", "telemedicina", "urgente"] as const);
        const r = rand();
        const stato = passato ? (r < 0.07 ? "no-show" : "completato") : (r < 0.05 ? "cancellato" : "confermato");
        const quadro = QUADRI[condizioneDi.get(paziente.id)!];
        appuntamentiRows.push({
          id: stableId(`appuntamento:${day.toISOString().slice(0, 10)}:${medico.id}:${hour}`),
          pazienteId: paziente.id,
          medicoId: medico.id,
          dataOra,
          durata: tipo === "prima-visita" ? 60 : tipo === "telemedicina" ? 20 : 30,
          tipo,
          stato,
          motivoVisita: tipo === "prima-visita" ? "Prima visita e raccolta anamnesi" : tipo === "telemedicina" ? "Revisione referti esami ematici" : quadro.motivo,
          ambulatorioId: ambulatorio.id,
        });
      }
    }
  }
  const createdAppuntamenti = appuntamentiRows.length
    ? await db.insert(appuntamenti).values(appuntamentiRows).returning()
    : [];

  // Clinical history: a visit for each completed appointment plus older visits over the past months.
  const visiteRows: (typeof visite.$inferInsert)[] = [];
  const addVisita = (key: string, pazienteId: string, medicoId: string, dataVisita: Date, appuntamentoId: string | null) => {
    const q = QUADRI[condizioneDi.get(pazienteId)!];
    // Own random sequence per visit, so the rest of the clinic does not depend on how many visits exist yet.
    const vrand = seededRand(key);
    const varia = (n: number, spread: number) => n + Math.round((vrand() - 0.5) * spread);
    const p = PAZIENTI[createdPazienti.findIndex((x) => x.id === pazienteId)];
    visiteRows.push({
      id: stableId(key),
      pazienteId,
      medicoId,
      appuntamentoId,
      dataVisita,
      motivoVisita: q.motivo,
      anamnesi: q.anamnesi,
      esameObiettivo: q.esameObiettivo,
      esamiEseguiti: q.esami ?? null,
      diagnosi: q.diagnosi,
      terapia: q.terapia,
      noteCliniche: vrand() < 0.5 ? "Controllo programmato tra 3 mesi." : null,
      peso: p.sesso === "M" ? varia(80, 16) : varia(64, 14),
      altezza: p.sesso === "M" ? varia(176, 12) : varia(164, 10),
      pressioneSistolica: varia(q.pressione[0], 10),
      pressioneDiastolica: varia(q.pressione[1], 8),
      frequenzaCardiaca: varia(q.fc, 8),
      temperatura: varia(365, 4),
      ambulatorioId: ambulatorio.id,
    });
  };

  for (const a of createdAppuntamenti) {
    if (a.stato === "completato") addVisita(`visita:${a.id}`, a.pazienteId, a.medicoId, a.dataOra, a.id);
  }
  for (const paziente of createdPazienti) {
    // Patients registered this week have no history yet.
    if (Date.now() - paziente.createdAt.getTime() < 7 * 86_400_000) continue;
    const storiche = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < storiche; i++) {
      const giorniFa = 20 + Math.floor(rand() * 200);
      const giorno = new Date(Date.UTC(today.year, today.month, today.day - giorniFa));
      // The clinic is closed on Sunday.
      if (giorno.getUTCDay() === 0) giorno.setUTCDate(giorno.getUTCDate() - 1);
      const [hour, minute] = pick(SLOTS);
      addVisita(`visita:${paziente.id}:${i}`, paziente.id, pick(medici).id, romeTime(giorno.getUTCFullYear(), giorno.getUTCMonth(), giorno.getUTCDate(), hour, minute), null);
    }
  }
  await db.insert(visite).values(visiteRows);
}
