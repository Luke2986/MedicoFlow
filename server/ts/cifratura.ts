import { constants, publicEncrypt, X509Certificate, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";

// The encryption certificate ships with the Sistema TS "Kit per lo sviluppo"; neither spec (2015, v1.3 2020) states the
// algorithm. RSA with PKCS#1 v1.5 padding is the assumption to confirm against the kit before going to production.

let cached: KeyObject | null | undefined;

export function caricaChiaveTs(): KeyObject | null {
  if (cached !== undefined) return cached;
  const pem = process.env.TS_CERT_PEM;
  const path = process.env.TS_CERT_PATH;
  if (!pem && !path) return (cached = null);
  const raw = pem ? Buffer.from(pem.replace(/\\n/g, "\n")) : readFileSync(path!);
  cached = new X509Certificate(raw).publicKey;
  return cached;
}

export function cifra(valore: string, chiave: KeyObject): string {
  return publicEncrypt({ key: chiave, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(valore, "utf8")).toString("base64");
}

/** Test-only: lets tests inject a generated key instead of the kit certificate. */
export function impostaChiaveTs(chiave: KeyObject | null) {
  cached = chiave;
}
