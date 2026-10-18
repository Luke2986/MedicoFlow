import { describe, expect, it } from "vitest";
import { generateKeyPairSync, privateDecrypt, constants } from "node:crypto";
import {
  pagamentoTracciato,
  richiedeBollo,
  totaleVociCentesimi,
  validaDocumento,
  dicituraIva,
  SOGLIA_BOLLO_CENTESIMI,
} from "../../shared/fiscale";
import { buildInserimentoXml, escapeXml, importoXml, parseRisposta } from "../../server/ts/xml";
import { cifra } from "../../server/ts/cifratura";
import { inviaInserimento } from "../../server/ts/client";

const base = {
  dataEmissione: "2026-10-18",
  dataPagamento: "2026-10-18",
  voci: [{ tipoSpesa: "SR", descrizione: "Visita", importoCentesimi: 12000 }],
  cfEmittente: "RSSMRA80A01H501U",
  pivaEmittente: "12345678901",
  cfPaziente: "DLCCRL61M05H501H",
};

describe("regole fiscali", () => {
  it("bollo only above €77.47 and only without VAT", () => {
    expect(richiedeBollo(SOGLIA_BOLLO_CENTESIMI, "N4")).toBe(false);
    expect(richiedeBollo(SOGLIA_BOLLO_CENTESIMI + 1, "N4")).toBe(true);
    expect(richiedeBollo(50_000, null)).toBe(false);
  });

  it("only cash is untraced", () => {
    expect(pagamentoTracciato("contanti")).toBe(false);
    expect(pagamentoTracciato("pos")).toBe(true);
    expect(pagamentoTracciato("bonifico")).toBe(true);
    expect(pagamentoTracciato("assegno")).toBe(true);
  });

  it("sums items in cents", () => {
    expect(totaleVociCentesimi([{ importoCentesimi: 1050 }, { importoCentesimi: 25 }])).toBe(1075);
  });

  it("accepts a complete document", () => {
    expect(validaDocumento(base)).toEqual([]);
  });

  it("rejects payment before issue, missing fiscal data, bad types and amounts", () => {
    expect(validaDocumento({ ...base, dataPagamento: "2026-10-17" })[0]).toMatch(/data di pagamento/);
    expect(validaDocumento({ ...base, cfEmittente: null, nomeEmittente: "Marco Ferrari" })[0]).toMatch(/di Marco Ferrari/);
    expect(validaDocumento({ ...base, pivaEmittente: "123" })[0]).toMatch(/partita IVA/);
    expect(validaDocumento({ ...base, voci: [{ ...base.voci[0], tipoSpesa: "FC" }] })[0]).toMatch(/non ammesso/);
    expect(validaDocumento({ ...base, voci: [{ ...base.voci[0], tipoSpesa: "IC", flagTipoSpesa: "2" }] })[0]).toMatch(/intramoenia/);
    expect(validaDocumento({ ...base, voci: [{ ...base.voci[0], importoCentesimi: 0 }] })[0]).toMatch(/maggiore di zero/);
    expect(validaDocumento({ ...base, voci: [{ ...base.voci[0], importoCentesimi: 10_000_000 }] })[0]).toMatch(/massimo/);
    expect(validaDocumento({ ...base, voci: [] })[0]).toMatch(/almeno una voce/);
  });

  it("prints the forfettario wording regardless of the nature code", () => {
    expect(dicituraIva("N2.2", "forfettario")).toMatch(/190\/2014/);
    expect(dicituraIva("N4", "ordinario")).toMatch(/art\. 10/);
  });
});

const doc = {
  pivaEmittente: "12345678901",
  dataEmissione: "2026-10-18",
  numero: 7,
  dataPagamento: "2026-10-18",
  voci: [
    { tipoSpesa: "SR", descrizione: "Visita", importoCentesimi: 12000 },
    { tipoSpesa: "SR", flagTipoSpesa: "2", descrizione: "ECG", importoCentesimi: 3050 },
  ],
  naturaIva: "N4",
  metodoPagamento: "contanti",
  tipoDocumento: "F",
  flagOpposizione: false,
};

describe("XML inserimento Sistema TS", () => {
  it("builds the request in the documentospesap730 namespace, in schema order", () => {
    const xml = buildInserimentoXml(doc, { pincode: "PIN64", cfProprietario: "CFP64", cfCittadino: "CFC64" });
    expect(xml).toContain('xmlns:doc="http://documentospesap730.sanita.finanze.it"');
    expect(xml).toContain("<doc:numDocumentoFiscale><doc:dispositivo>1</doc:dispositivo><doc:numDocumento>7</doc:numDocumento>");
    expect(xml).toContain("<doc:cfCittadino>CFC64</doc:cfCittadino>");
    expect(xml).toContain("<doc:flagTipoSpesa>2</doc:flagTipoSpesa><doc:importo>30.50</doc:importo><doc:naturaIVA>N4</doc:naturaIVA>");
    expect(xml).toContain("<doc:pagamentoTracciato>NO</doc:pagamentoTracciato><doc:tipoDocumento>F</doc:tipoDocumento><doc:flagOpposizione>0</doc:flagOpposizione>");
    const order = ["pincode", "Proprietario", "idSpesa", "dataPagamento", "cfCittadino", "voceSpesa", "pagamentoTracciato", "tipoDocumento", "flagOpposizione"];
    const positions = order.map((t) => xml.indexOf(`<doc:${t}>`));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("omits cfCittadino when the patient opposes", () => {
    const xml = buildInserimentoXml({ ...doc, flagOpposizione: true }, { pincode: "P", cfProprietario: "C", cfCittadino: "SHOULD-NOT-APPEAR" });
    expect(xml).not.toContain("cfCittadino");
    expect(xml).toContain("<doc:flagOpposizione>1</doc:flagOpposizione>");
  });

  it("refuses a document without opposition and without the patient's code", () => {
    expect(() => buildInserimentoXml(doc, { pincode: "P", cfProprietario: "C" })).toThrow();
  });

  it("escapes XML and formats amounts with two decimals", () => {
    expect(escapeXml(`a<b>&"'`)).toBe("a&lt;b&gt;&amp;&quot;&apos;");
    expect(importoXml(5)).toBe("0.05");
  });

  it("parses an accepted response with warnings", () => {
    const r = parseRisposta(
      `<soap:Envelope><soap:Body><ns2:inserimentoDocumentoSpesaResponse><ns2:esitoChiamata>2</ns2:esitoChiamata>` +
        `<ns2:protocollo>26101812345678901</ns2:protocollo><ns2:listaMessaggi><ns2:messaggio><ns2:codice>W01</ns2:codice>` +
        `<ns2:descrizione>Avviso &amp; nota</ns2:descrizione><ns2:tipo>W</ns2:tipo></ns2:messaggio></ns2:listaMessaggi>` +
        `</ns2:inserimentoDocumentoSpesaResponse></soap:Body></soap:Envelope>`,
    );
    expect(r).toEqual({ esitoChiamata: 2, protocollo: "26101812345678901", messaggi: [{ codice: "W01", descrizione: "Avviso & nota", tipo: "W" }] });
  });

  it("parses a SOAP fault", () => {
    expect(parseRisposta("<s:Fault><faultstring>Schema non valido</faultstring></s:Fault>").fault).toBe("Schema non valido");
  });
});

describe("cifratura", () => {
  it("encrypts with the certificate's public key (RSA PKCS#1 v1.5)", () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    const enc = cifra("RSSMRA80A01H501U", publicKey);
    const dec = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(enc, "base64"));
    expect(dec.toString()).toBe("RSSMRA80A01H501U");
  });
});

describe("client Sistema TS", () => {
  it("posts to the test endpoint with basic auth and SOAPAction, and keeps credentials out of errors", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const ok = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return new Response("<esitoChiamata>0</esitoChiamata><protocollo>1</protocollo>", { status: 200 });
    }) as unknown as typeof fetch;
    const esito = await inviaInserimento("<x/>", { utente: "u", password: "segreta" }, ok);
    expect(esito.esitoChiamata).toBe(0);
    expect(seen!.url).toContain("invioSS730pTest");
    const headers = seen!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("u:segreta").toString("base64")}`);
    expect(headers.SOAPAction).toBe('"inserimento.documentospesap730.sanita.finanze.it"');

    const denied = (async () => new Response("", { status: 401 })) as unknown as typeof fetch;
    await expect(inviaInserimento("<x/>", { utente: "u", password: "segreta" }, denied)).rejects.toThrow(/^Credenziali Sistema TS rifiutate$/);

    const down = (async () => {
      throw new Error("connect ECONNREFUSED segreta");
    }) as unknown as typeof fetch;
    const err = await inviaInserimento("<x/>", { utente: "u", password: "segreta" }, down).catch((e) => e as Error);
    expect(err.message).not.toContain("segreta");
  });
});
