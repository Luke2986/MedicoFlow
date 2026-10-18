import {
  CAMPI_NUMERICI,
  CAMPI_TESTO,
  campiVuoti,
  type CampiReferto,
  type CampoNumerico,
  type CampoTesto,
  type MotoreReferto,
  type PropostaReferto,
} from "../../shared/referto";
import { correctMedicalText } from "./medical-dictionary";
import { getGroq, TRANSCRIPTION_PROVIDER } from "./whisper";
import { MODELLO_SIMULATO, PROVIDER_SIMULATO, attesaSimulata, classificaFrasi, simulazioneAttiva } from "./simulazione";
import { logError } from "../log";

export const MODELLO_REFERTO = "llama-3.3-70b-versatile";
export const MODELLO_REGOLE = "regole-v1";
const MAX_CAMPO = 5000;

const LIMITI: Record<CampoNumerico, [number, number]> = {
  pressioneSistolica: [60, 260],
  pressioneDiastolica: [30, 160],
  frequenzaCardiaca: [20, 250],
  peso: [1, 350],
  altezza: [40, 250],
  temperatura: [340, 430],
};

function nelLimite(campo: CampoNumerico, valore: number | null): number | null {
  if (valore === null || !Number.isInteger(valore)) return null;
  const [min, max] = LIMITI[campo];
  return valore >= min && valore <= max ? valore : null;
}

// Spoken section cues. A cue counts only at the start of a sentence and followed by punctuation,
// so "in terapia con ramipril" inside a sentence does not open the "terapia" section.
const SEZIONI: { campo: CampoTesto; parole: string }[] = [
  { campo: "motivoVisita", parole: "motivo(?: della visita)?" },
  { campo: "anamnesi", parole: "anamnesi" },
  { campo: "esameObiettivo", parole: "esame obiettivo|obiettivit[àa]" },
  { campo: "esamiEseguiti", parole: "esami(?: eseguiti| strumentali| di laboratorio)?|accertamenti" },
  { campo: "diagnosi", parole: "diagnosi|conclusioni" },
  { campo: "terapia", parole: "terapia|trattamento" },
  { campo: "prescrizioneFarmaci", parole: "prescrizione(?: farmaci)?|prescrivo" },
  { campo: "noteCliniche", parole: "note|annotazioni" },
];
const RE_SEZIONE = new RegExp(
  `(^|[.!?\\n]\\s*)(${SEZIONI.map((s) => `(?<${s.campo}>${s.parole})`).join("|")})\\s*[:,.;]\\s*`,
  "gi",
);

function pulisci(testo: string): string {
  return testo.replace(/\s+/g, " ").replace(/^[\s,.;:]+|[\s,;:]+$/g, "").slice(0, MAX_CAMPO);
}

function intero(s: string | undefined): number | null {
  return s === undefined ? null : Number.parseInt(s, 10);
}

export function estraiParametri(testo: string): Pick<CampiReferto, CampoNumerico> {
  const pa = testo.match(/(?:pressione(?: arteriosa)?|\bPA\b)\D{0,20}?(\d{2,3})\s*(?:su|\/)\s*(\d{2,3})/i);
  const fc = testo.match(/(?:frequenza(?: cardiaca)?|\bFC\b|polso)\D{0,15}?(\d{2,3})/i);
  const peso = testo.match(/\bpeso\D{0,15}?(\d{1,3})(?:[.,]\d)?/i);
  const altezzaCm = testo.match(/\baltezza\D{0,15}?(\d{3})\b/i);
  const altezzaM = testo.match(/\baltezza\D{0,15}?(\d)\s*(?:[.,]|metri e|e)\s*(\d{2})\b/i);
  const temp = testo.match(/\btemperatura\D{0,15}?(\d{2})(?:\s*(?:[.,]|e|virgola)\s*(\d))?/i);
  return {
    pressioneSistolica: nelLimite("pressioneSistolica", intero(pa?.[1])),
    pressioneDiastolica: nelLimite("pressioneDiastolica", intero(pa?.[2])),
    frequenzaCardiaca: nelLimite("frequenzaCardiaca", intero(fc?.[1])),
    peso: nelLimite("peso", intero(peso?.[1])),
    altezza: nelLimite(
      "altezza",
      altezzaCm ? intero(altezzaCm[1]) : altezzaM ? Number(altezzaM[1]) * 100 + Number(altezzaM[2]) : null,
    ),
    temperatura: nelLimite("temperatura", temp ? Number(temp[1]) * 10 + Number(temp[2] ?? 0) : null),
  };
}

/** Splits on the section names said aloud; `prima` is the text dictated before the first section name. */
export function dividiSezioni(testoGrezzo: string): { campi: CampiReferto; prima: string; testo: string } {
  const testo = correctMedicalText(testoGrezzo).correctedText;
  const campi = campiVuoti();
  const inizi: { campo: CampoTesto; da: number; a: number }[] = [];
  for (const m of Array.from(testo.matchAll(RE_SEZIONE))) {
    const campo = SEZIONI.find((s) => m.groups?.[s.campo])!.campo;
    inizi.push({ campo, da: m.index! + m[1].length, a: m.index! + m[0].length });
  }
  inizi.forEach((s, i) => {
    const contenuto = pulisci(testo.slice(s.a, inizi[i + 1]?.da ?? testo.length));
    if (contenuto) campi[s.campo] = campi[s.campo] ? `${campi[s.campo]} ${contenuto}` : contenuto;
  });
  return { campi: { ...campi, ...estraiParametri(testo) }, prima: pulisci(testo.slice(0, inizi[0]?.da ?? testo.length)), testo };
}

/** Deterministic split on the section names the doctor says aloud. Runs without any AI provider. */
export function strutturaConRegole(testoGrezzo: string): CampiReferto {
  const { campi, prima } = dividiSezioni(testoGrezzo);
  // Nothing dictated is lost: text before the first cue goes to the notes when no notes were dictated.
  if (prima && !campi.noteCliniche) campi.noteCliniche = prima;
  return campi;
}

/**
 * Demo stand-in for the language model: the spoken sections, plus free sentences assigned by clinical keywords.
 * Like the model, it never adds content and capitalises each field.
 */
export function strutturaSimulata(testoGrezzo: string): CampiReferto {
  const { campi, prima } = dividiSezioni(testoGrezzo);
  for (const [campo, frasi] of Object.entries(classificaFrasi(prima)) as [CampoTesto, string][]) {
    campi[campo] = campi[campo] ? `${frasi} ${campi[campo]}` : frasi;
  }
  for (const k of CAMPI_TESTO) {
    if (campi[k]) campi[k] = campi[k].charAt(0).toUpperCase() + campi[k].slice(1);
  }
  return campi;
}

const PROMPT_SISTEMA = `Sei un assistente che riordina la dettatura di un medico italiano nei campi di una cartella clinica.
Regole obbligatorie:
- Usa SOLO informazioni dette esplicitamente nella dettatura. Non dedurre, non completare, non suggerire diagnosi, terapie o esami.
- Mantieni le parole del medico: puoi solo togliere intercalari ed esitazioni e sistemare la punteggiatura.
- Se un campo non è stato dettato lascialo "" (testo) o null (numeri).
- I numeri dei parametri vitali vanno riportati solo se detti: temperatura in decimi di grado (37,5 °C = 375), peso in kg, altezza in cm.
Rispondi SOLO con un oggetto JSON con queste chiavi: ${[...CAMPI_TESTO, ...CAMPI_NUMERICI].join(", ")}.`;

export function messaggiLlm(testo: string, specializzazione: string) {
  return [
    { role: "system" as const, content: PROMPT_SISTEMA },
    { role: "user" as const, content: `Specialità dello studio: ${specializzazione}\n\nDettatura:\n"""\n${testo}\n"""` },
  ];
}

/** Keeps only known keys with the right type, and drops vital signs whose number never appears in the dictation. */
export function normalizzaRisposta(raw: unknown, testo: string): CampiReferto {
  const campi = campiVuoti();
  if (!raw || typeof raw !== "object") return campi;
  const r = raw as Record<string, unknown>;
  for (const k of CAMPI_TESTO) {
    if (typeof r[k] === "string") campi[k] = pulisci(r[k] as string);
  }
  const numeriDetti = new Set((testo.match(/\d+/g) ?? []).map(Number));
  const detto = (k: CampoNumerico, v: number) =>
    k === "temperatura" ? numeriDetti.has(Math.floor(v / 10)) && (v % 10 === 0 || numeriDetti.has(v % 10)) : numeriDetti.has(v);
  for (const k of CAMPI_NUMERICI) {
    const v = typeof r[k] === "number" ? nelLimite(k, r[k] as number) : null;
    campi[k] = v !== null && detto(k, v) ? v : null;
  }
  return campi;
}

type ChatClient = {
  chat: { completions: { create: (body: any) => Promise<{ choices: { message?: { content?: string | null } }[] }> } };
};

export async function strutturaConLlm(testo: string, specializzazione: string, client: ChatClient = getGroq()): Promise<CampiReferto> {
  const completion = await client.chat.completions.create({
    model: MODELLO_REFERTO,
    messages: messaggiLlm(testo, specializzazione),
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 2000,
  });
  const contenuto = completion.choices[0]?.message?.content;
  if (!contenuto) throw new Error("Risposta vuota dal modello");
  return normalizzaRisposta(JSON.parse(contenuto), testo);
}

export function fornitoreReferto(motore: MotoreReferto): { provider: string; modello: string } {
  if (motore === "llm") return { provider: TRANSCRIPTION_PROVIDER, modello: MODELLO_REFERTO };
  if (motore === "simulato") return { provider: PROVIDER_SIMULATO, modello: MODELLO_SIMULATO };
  return { provider: "locale", modello: MODELLO_REGOLE };
}

export function strutturazioneLlmDisponibile() {
  return !!process.env.GROQ_API_KEY;
}

/** Uses the language model when configured; otherwise, or if the model fails, the deterministic rules. */
export async function strutturaReferto(
  testo: string,
  ctx: { specializzazione: string; client?: ChatClient },
): Promise<PropostaReferto> {
  if (!ctx.client && simulazioneAttiva()) {
    await attesaSimulata(1400);
    return { campi: strutturaSimulata(testo), motore: "simulato" };
  }
  if (ctx.client || strutturazioneLlmDisponibile()) {
    try {
      return { campi: await strutturaConLlm(testo, ctx.specializzazione, ctx.client), motore: "llm" };
    } catch (error) {
      // Only the error is logged, never the dictated text.
      logError("Strutturazione LLM non riuscita, uso le regole:", error instanceof Error ? error.message : "errore");
    }
  }
  return { campi: strutturaConRegole(testo), motore: "regole" };
}
