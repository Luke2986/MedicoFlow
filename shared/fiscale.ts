// Rules from "730 Spese Sanitarie – Web service sincrono", v1.3 of 20/12/2020, and the bollo rules of DPR 642/1972.
// The VAT nature and the bollo handling must be confirmed by the clinic's accountant.

/** Expense types a "Medico o Odontoiatra" may send (spec v1.3, table of senders, p. 14). */
export const TIPI_SPESA_MEDICO = {
  SR: "Prestazioni sanitarie: visita medica generica o specialistica, prestazioni diagnostiche e strumentali, certificazioni (esclusa la chirurgia estetica)",
  IC: "Prestazioni di chirurgia estetica e di medicina estetica",
  AA: "Altre spese",
} as const;
export type TipoSpesaMedico = keyof typeof TIPI_SPESA_MEDICO;

/** flagTipoSpesa "2" marks an intramoenia visit and is allowed only with SR (spec v1.3, p. 12). */
export const FLAG_INTRAMOENIA = "2";

export const NATURE_IVA = {
  N1: "N1 – Operazione esclusa ex art. 15 DPR 633/72",
  N2: "N2 – Operazione non soggetta",
  "N2.2": "N2.2 – Non soggetta, altri casi (es. regime forfettario)",
  N3: "N3 – Operazione non imponibile",
  N4: "N4 – Operazione esente",
  N5: "N5 – Regime del margine",
  N6: "N6 – Inversione contabile",
  N7: "N7 – IVA assolta in altro Stato UE",
} as const;
export type NaturaIva = keyof typeof NATURE_IVA;

export const REGIMI_FISCALI = {
  ordinario: "Ordinario",
  forfettario: "Forfettario (L. 190/2014)",
} as const;
export type RegimeFiscale = keyof typeof REGIMI_FISCALI;

/** Wording printed on the invoice; the accountant must confirm it for each doctor. */
export function dicituraIva(naturaIva: string, regime: string | null | undefined): string {
  if (regime === "forfettario") {
    return "Operazione effettuata ai sensi dell'art. 1, commi 54-89, della Legge 190/2014 (regime forfettario). Operazione senza applicazione dell'IVA.";
  }
  if (naturaIva === "N4") return "Operazione esente IVA ai sensi dell'art. 10, comma 1, n. 18, DPR 633/1972.";
  return NATURE_IVA[naturaIva as NaturaIva] ?? naturaIva;
}

export const METODI_PAGAMENTO = {
  contanti: "Contanti",
  pos: "Carta / bancomat (POS)",
  bonifico: "Bonifico",
  assegno: "Assegno",
} as const;
export type MetodoPagamento = keyof typeof METODI_PAGAMENTO;

export const STATI_TS = ["da_inviare", "inviato", "errore", "escluso"] as const;
export type StatoTs = (typeof STATI_TS)[number];

/** Bollo of €2 is due on invoices for VAT-exempt or out-of-scope operations above €77.47. */
export const SOGLIA_BOLLO_CENTESIMI = 7747;
export const IMPORTO_BOLLO_CENTESIMI = 200;

/** The spec allows amounts of 5 integer digits + 2 decimals. */
export const IMPORTO_MAX_CENTESIMI = 9_999_999;

export function totaleVociCentesimi(voci: ReadonlyArray<{ importoCentesimi: number }>): number {
  return voci.reduce((sum, v) => sum + v.importoCentesimi, 0);
}

export function richiedeBollo(totaleCentesimi: number, naturaIva: string | null | undefined): boolean {
  return !!naturaIva && totaleCentesimi > SOGLIA_BOLLO_CENTESIMI;
}

export function pagamentoTracciato(metodo: MetodoPagamento): boolean {
  return metodo !== "contanti";
}

export function formatEuro(centesimi: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(centesimi / 100);
}

export interface DatiDocumentoDaValidare {
  dataEmissione: string;
  dataPagamento: string;
  voci: ReadonlyArray<{ tipoSpesa: string; flagTipoSpesa?: string; importoCentesimi: number; descrizione: string }>;
  cfEmittente: string | null | undefined;
  pivaEmittente: string | null | undefined;
  cfPaziente: string | null | undefined;
  nomeEmittente?: string;
}

/** Returns the list of problems; an empty list means the document can be issued. */
export function validaDocumento(d: DatiDocumentoDaValidare): string[] {
  const errori: string[] = [];
  const chi = d.nomeEmittente ? `di ${d.nomeEmittente}` : "del medico emittente";
  if (!d.cfEmittente) errori.push(`Manca il codice fiscale ${chi} (Impostazioni → Dati fiscali).`);
  if (!d.pivaEmittente || !/^\d{11}$/.test(d.pivaEmittente)) {
    errori.push(`Manca la partita IVA ${chi}, o non è di 11 cifre (Impostazioni → Dati fiscali).`);
  }
  if (!d.cfPaziente) errori.push("Il paziente non ha un codice fiscale.");
  if (d.dataPagamento < d.dataEmissione) {
    errori.push("La data di pagamento non può precedere la data di emissione.");
  }
  if (d.voci.length === 0) errori.push("Serve almeno una voce di spesa.");
  for (const v of d.voci) {
    if (!(v.tipoSpesa in TIPI_SPESA_MEDICO)) errori.push(`Tipo di spesa non ammesso per un medico: ${v.tipoSpesa}.`);
    if (v.flagTipoSpesa && !(v.flagTipoSpesa === FLAG_INTRAMOENIA && v.tipoSpesa === "SR")) {
      errori.push("L'indicazione intramoenia è ammessa solo con il tipo di spesa SR.");
    }
    if (!Number.isInteger(v.importoCentesimi) || v.importoCentesimi <= 0) {
      errori.push("Ogni importo deve essere maggiore di zero.");
    } else if (v.importoCentesimi > IMPORTO_MAX_CENTESIMI) {
      errori.push("Importo oltre il massimo ammesso dal Sistema TS (99.999,99 €).");
    }
    if (!v.descrizione.trim()) errori.push("Ogni voce deve avere una descrizione.");
  }
  return errori;
}
