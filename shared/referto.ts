export const CAMPI_TESTO = [
  "motivoVisita",
  "anamnesi",
  "esameObiettivo",
  "esamiEseguiti",
  "diagnosi",
  "terapia",
  "prescrizioneFarmaci",
  "noteCliniche",
] as const;

export const CAMPI_NUMERICI = [
  "pressioneSistolica",
  "pressioneDiastolica",
  "frequenzaCardiaca",
  "peso",
  "altezza",
  "temperatura",
] as const;

export type CampoTesto = (typeof CAMPI_TESTO)[number];
export type CampoNumerico = (typeof CAMPI_NUMERICI)[number];
export type CampoReferto = CampoTesto | CampoNumerico;

/** Same names and units as the `visite` table: temperature in tenths of a degree, weight in kg, height in cm. */
export type CampiReferto = Record<CampoTesto, string> & Record<CampoNumerico, number | null>;

/** "simulato" exists only in the public demo without an AI provider: see server/ai/simulazione.ts. */
export type MotoreReferto = "llm" | "regole" | "simulato";

export interface PropostaReferto {
  campi: CampiReferto;
  motore: MotoreReferto;
}

export const ETICHETTE_CAMPI: Record<CampoReferto, string> = {
  motivoVisita: "Motivo visita",
  anamnesi: "Anamnesi",
  esameObiettivo: "Esame obiettivo",
  esamiEseguiti: "Esami strumentali / laboratorio",
  diagnosi: "Diagnosi",
  terapia: "Terapia",
  prescrizioneFarmaci: "Prescrizione farmaci",
  noteCliniche: "Note cliniche",
  pressioneSistolica: "Pressione sistolica (mmHg)",
  pressioneDiastolica: "Pressione diastolica (mmHg)",
  frequenzaCardiaca: "Frequenza cardiaca (bpm)",
  peso: "Peso (kg)",
  altezza: "Altezza (cm)",
  temperatura: "Temperatura (decimi di °C)",
};

export function campiVuoti(): CampiReferto {
  return {
    motivoVisita: "", anamnesi: "", esameObiettivo: "", esamiEseguiti: "",
    diagnosi: "", terapia: "", prescrizioneFarmaci: "", noteCliniche: "",
    pressioneSistolica: null, pressioneDiastolica: null, frequenzaCardiaca: null,
    peso: null, altezza: null, temperatura: null,
  };
}
