import { isInMemory } from "../db";
import type { CampoTesto } from "../../shared/referto";
import type { Visita } from "../../shared/schema";
import { DETTATURE_ESEMPIO } from "../../shared/dettature-esempio";

// The public demo has no AI provider. It still shows the whole flow (consent gate, audit log, review), with a
// simulated provider in place of the real one. Never active with a real database or with an API key.
export const PROVIDER_SIMULATO = "simulato";
export const MODELLO_SIMULATO = "simulazione-demo";

export function simulazioneAttiva(): boolean {
  return isInMemory && process.env.DEMO_DATA !== "false" && !process.env.GROQ_API_KEY;
}

/** Latency of a real provider, so the demo feels like one. Skipped in tests. */
export function attesaSimulata(ms: number): Promise<void> {
  if (process.env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms + Math.floor(Math.random() * 500)));
}

const varia = (n: number | null, delta: number) => (n === null ? null : n + Math.round((Math.random() - 0.5) * 2 * delta));
const frase = (s: string | null | undefined) => {
  const t = (s ?? "").replace(/\s*\([A-Z]\d{2}(?:\.\d+)?\)/g, "").trim().replace(/[.\s]+$/, "");
  // Acronyms such as "BPCO" keep their case.
  return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
};

/**
 * What the doctor would plausibly dictate for this patient: built from the last visit on record, with vital signs
 * slightly changed, so each recording differs. Patients without history get one of the sample dictations.
 */
export function dettaturaSimulata(visitePrecedenti: Visita[]): string {
  const v = visitePrecedenti[0];
  if (!v) return DETTATURE_ESEMPIO[Math.floor(Math.random() * DETTATURE_ESEMPIO.length)].testo;
  const parti: string[] = [];
  if (v.motivoVisita) parti.push(`Motivo della visita: ${frase(v.motivoVisita)}.`);
  if (v.anamnesi) parti.push(`Anamnesi: ${frase(v.anamnesi)}.`);
  const vitali: string[] = [];
  const pas = varia(v.pressioneSistolica, 6);
  const pad = varia(v.pressioneDiastolica, 4);
  if (pas && pad) vitali.push(`pressione ${pas} su ${pad}`);
  const fc = varia(v.frequenzaCardiaca, 5);
  if (fc) vitali.push(`frequenza ${fc}`);
  if (v.esameObiettivo || vitali.length) {
    parti.push(`Esame obiettivo: ${[frase(v.esameObiettivo), ...vitali].filter(Boolean).join(", ")}.`);
  }
  if (v.diagnosi) parti.push(`Diagnosi: ${frase(v.diagnosi)}.`);
  if (v.terapia) parti.push(`Terapia: ${frase(v.terapia)}.`);
  if (v.esamiEseguiti) parti.push(`Esami: ${frase(v.esamiEseguiti)}.`);
  parti.push("Note: ricontrollo tra tre mesi.");
  return parti.join(" ");
}

// Keyword hints for sentences dictated without a section name. Order breaks ties.
const INDIZI: { campo: CampoTesto; re: RegExp }[] = [
  { campo: "motivoVisita", re: /\b(si presenta|viene (in visita|per)|giunge|accede|richiede (una )?visita)\b/gi },
  { campo: "diagnosi", re: /\b(diagnosi|quadro (compatibile|di|clinico)|compatibile con|si tratta di|sospett[ao])\b/gi },
  { campo: "noteCliniche", re: /\b(ricontrollo|controllo tra|rivedo|follow.?up|richiamare|prossima visita)\b/gi },
  { campo: "esamiEseguiti", re: /\b(ecg|elettrocardiogramma|emocromo|ecografi\w*|rx|radiografi\w*|spirometri\w*|tac|risonanza|esami (del sangue|ematici)|profilo lipidico|glicemia|emoglobina glicata|tsh|holter)\b/gi },
  { campo: "terapia", re: /(\b\d+([.,]\d+)?\s?(mg|mcg|g|ml|gocce)\b|\b(compress\w*|cp|bustin\w*|volte al giorno|al bisogno|al mattino|alla sera|prescrivo|consiglio|inizia|sospend\w*|prosegu\w*|riposo|fisioterapia)\b)/gi },
  { campo: "esameObiettivo", re: /\b(all.esame|obiettiv\w*|toni cardiaci|murmure|addome|palpazione|auscultazione|saturazione|pressione|frequenza|polsi|cute|riflessi|las[eè]gue|edemi|trattabile)\b/gi },
  { campo: "anamnesi", re: /\b(riferisce|lamenta|nega|racconta|da (circa )?(\w+ )?(giorni|settimane|mesi|anni)|in terapia con|storia di|noto|nota da|familiarit\w*|fumatore|ex fumatore|allergi\w*|insorto|insorta)\b/gi },
];

export function classificaFrasi(testo: string): Partial<Record<CampoTesto, string>> {
  const out: Partial<Record<CampoTesto, string>> = {};
  const frasi = testo
    .replace(/^(allora|dunque|ok|bene|allora vediamo)[,\s]+/i, "")
    .split(/(?<=[.!?])\s+/)
    .map((f) => f.trim())
    .filter(Boolean);
  for (const f of frasi) {
    let migliore: CampoTesto = "noteCliniche";
    let punti = 0;
    for (const { campo, re } of INDIZI) {
      const n = f.match(re)?.length ?? 0;
      if (n > punti) {
        punti = n;
        migliore = campo;
      }
    }
    out[migliore] = out[migliore] ? `${out[migliore]} ${f}` : f;
  }
  return out;
}
