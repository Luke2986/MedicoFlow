import { validateCodiceFiscale } from "../../shared/validators";

const MONTH_LETTERS = "ABCDEHLMPRST";

function letters(s: string) {
  const clean = s.toUpperCase().normalize("NFD").replace(/[^A-Z]/g, "");
  return {
    consonants: clean.replace(/[AEIOU]/g, ""),
    vowels: clean.replace(/[^AEIOU]/g, ""),
  };
}

function surnameCode(cognome: string) {
  const { consonants, vowels } = letters(cognome);
  return (consonants + vowels + "XXX").slice(0, 3);
}

function nameCode(nome: string) {
  const { consonants, vowels } = letters(nome);
  if (consonants.length >= 4) return consonants[0] + consonants[2] + consonants[3];
  return (consonants + vowels + "XXX").slice(0, 3);
}

/** Builds a formally valid codice fiscale (no omocodia handling: demo data only). */
export function buildCodiceFiscale(p: {
  nome: string;
  cognome: string;
  dataNascita: Date;
  sesso: "M" | "F";
  codiceComune: string;
}): string {
  const year = String(p.dataNascita.getUTCFullYear()).slice(2);
  const month = MONTH_LETTERS[p.dataNascita.getUTCMonth()];
  const day = String(p.dataNascita.getUTCDate() + (p.sesso === "F" ? 40 : 0)).padStart(2, "0");
  const body = surnameCode(p.cognome) + nameCode(p.nome) + year + month + day + p.codiceComune;
  for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    if (validateCodiceFiscale(body + c)) return body + c;
  }
  throw new Error(`Codice fiscale non generabile per ${p.cognome} ${p.nome}`);
}
