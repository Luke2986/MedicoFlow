import { SOAP_ACTION_INSERIMENTO, parseRisposta, type EsitoTs } from "./xml";

const ENDPOINT = {
  test: "https://invioSS730pTest.sanita.finanze.it/DocumentoSpesa730pWeb/DocumentoSpesa730pPort",
  prod: "https://invioSS730p.sanita.finanze.it/DocumentoSpesa730pWeb/DocumentoSpesa730pPort",
} as const;

export type AmbienteTs = keyof typeof ENDPOINT;

export function ambienteTs(): AmbienteTs {
  return process.env.TS_ENV === "prod" ? "prod" : "test";
}

export function endpointTs(): string {
  return ENDPOINT[ambienteTs()];
}

export interface CredenzialiTs {
  utente: string;
  password: string;
}

/** Credentials stay in this call: never logged, never persisted, never put in an error message. */
export async function inviaInserimento(xml: string, credenziali: CredenzialiTs, fetchImpl: typeof fetch = fetch): Promise<EsitoTs> {
  const auth = Buffer.from(`${credenziali.utente}:${credenziali.password}`).toString("base64");
  let res: Response;
  try {
    res = await fetchImpl(endpointTs(), {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `"${SOAP_ACTION_INSERIMENTO}"`,
        Authorization: `Basic ${auth}`,
      },
      body: xml,
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new Error("Sistema TS non raggiungibile o tempo scaduto");
  }
  if (res.status === 401 || res.status === 403) throw new Error("Credenziali Sistema TS rifiutate");
  const body = await res.text();
  const esito = parseRisposta(body);
  if (esito.esitoChiamata === null && !esito.fault) throw new Error(`Risposta inattesa dal Sistema TS (HTTP ${res.status})`);
  return esito;
}
