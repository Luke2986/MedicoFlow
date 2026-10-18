import type { DocumentoSpesa, MessaggioTs } from "../../shared/schema";
import { pagamentoTracciato, type MetodoPagamento } from "../../shared/fiscale";

// Namespace, element names and order come from DocumentoSpesa730pSchema.xsd / DocumentoSpesa730p.wsdl as published in the
// 12/11/2015 spec. Fields added later (naturaIVA, pagamentoTracciato, tipoDocumento, flagOpposizione) follow the table
// order of spec v1.3 (20/12/2020): validate the output against the current XSD of the kit.
export const TS_NAMESPACE = "http://documentospesap730.sanita.finanze.it";
export const SOAP_ACTION_INSERIMENTO = "inserimento.documentospesap730.sanita.finanze.it";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const el = (name: string, value: string | number) => `<doc:${name}>${escapeXml(String(value))}</doc:${name}>`;

export interface DatiCifrati {
  pincode: string;
  cfProprietario: string;
  /** Omitted when the patient opposed the transmission. */
  cfCittadino?: string;
}

export function importoXml(centesimi: number): string {
  return (centesimi / 100).toFixed(2);
}

export function buildInserimentoXml(
  doc: Pick<DocumentoSpesa, "pivaEmittente" | "dataEmissione" | "numero" | "dataPagamento" | "voci" | "naturaIva" | "metodoPagamento" | "tipoDocumento" | "flagOpposizione">,
  cifrati: DatiCifrati,
): string {
  if (!doc.flagOpposizione && !cifrati.cfCittadino) throw new Error("cfCittadino obbligatorio senza opposizione");
  const voci = doc.voci
    .map(
      (v) =>
        "<doc:voceSpesa>" +
        el("tipoSpesa", v.tipoSpesa) +
        (v.flagTipoSpesa ? el("flagTipoSpesa", v.flagTipoSpesa) : "") +
        el("importo", importoXml(v.importoCentesimi)) +
        el("naturaIVA", doc.naturaIva) +
        "</doc:voceSpesa>",
    )
    .join("");

  const corpo =
    el("pincode", cifrati.pincode) +
    "<doc:Proprietario>" + el("cfProprietario", cifrati.cfProprietario) + "</doc:Proprietario>" +
    "<doc:idInserimentoDocumentoFiscale>" +
    "<doc:idSpesa>" +
    el("pIva", doc.pivaEmittente) +
    el("dataEmissione", doc.dataEmissione) +
    "<doc:numDocumentoFiscale>" + el("dispositivo", 1) + el("numDocumento", doc.numero) + "</doc:numDocumentoFiscale>" +
    "</doc:idSpesa>" +
    el("dataPagamento", doc.dataPagamento) +
    (doc.flagOpposizione ? "" : el("cfCittadino", cifrati.cfCittadino!)) +
    voci +
    el("pagamentoTracciato", pagamentoTracciato(doc.metodoPagamento as MetodoPagamento) ? "SI" : "NO") +
    el("tipoDocumento", doc.tipoDocumento) +
    el("flagOpposizione", doc.flagOpposizione ? 1 : 0) +
    "</doc:idInserimentoDocumentoFiscale>";

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:doc="${TS_NAMESPACE}">` +
    "<soapenv:Header/><soapenv:Body>" +
    `<doc:inserimentoDocumentoSpesaRequest>${corpo}</doc:inserimentoDocumentoSpesaRequest>` +
    "</soapenv:Body></soapenv:Envelope>"
  );
}

export interface EsitoTs {
  esitoChiamata: number | null;
  protocollo: string | null;
  messaggi: MessaggioTs[];
  fault?: string;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function testo(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<(?:[\\w-]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${tag}>`));
  return m ? unescapeXml(m[1].trim()) : null;
}

export function parseRisposta(xml: string): EsitoTs {
  const fault = testo(xml, "faultstring");
  if (fault !== null) return { esitoChiamata: null, protocollo: null, messaggi: [], fault };
  const esito = testo(xml, "esitoChiamata");
  const messaggi: MessaggioTs[] = [];
  const re = /<(?:[\w-]+:)?messaggio(?:\s[^>]*)?>([\s\S]*?)<\/(?:[\w-]+:)?messaggio>/g;
  for (const m of Array.from(xml.matchAll(re))) {
    messaggi.push({ codice: testo(m[1], "codice") ?? "", descrizione: testo(m[1], "descrizione") ?? "", tipo: testo(m[1], "tipo") ?? "" });
  }
  return {
    esitoChiamata: esito !== null && /^\d+$/.test(esito) ? Number(esito) : null,
    protocollo: testo(xml, "protocollo") || null,
    messaggi,
  };
}
