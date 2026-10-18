import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { logError } from "../log";
import { caricaChiaveTs, cifra } from "../ts/cifratura";
import { buildInserimentoXml } from "../ts/xml";
import { ambienteTs, inviaInserimento } from "../ts/client";
import { puoGestireDocumento } from "./documenti-spesa";
import { isInMemory } from "../db";
import { demoDataEnabled } from "../prepare-db";
import type { MessaggioTs } from "../../shared/schema";

export const MAX_DOCUMENTI_PER_INVIO = 20;

// The public demo is shared by every visitor: real Sistema TS credentials must never be typed into it.
const invioDisattivato = isInMemory && demoDataEnabled;

const invioSchema = z.object({
  credenziali: z.object({
    utente: z.string().min(1, "Utente Sistema TS obbligatorio"),
    password: z.string().min(1, "Password Sistema TS obbligatoria"),
    pincode: z.string().min(1, "Pincode obbligatorio"),
  }),
  documentoIds: z.array(z.string().min(1)).min(1).max(MAX_DOCUMENTI_PER_INVIO, `Al massimo ${MAX_DOCUMENTI_PER_INVIO} documenti per invio`),
});

interface RisultatoInvio {
  id: string;
  numero: number;
  anno: number;
  statoTs: string;
  esitoTs: number | null;
  protocolloTs: string | null;
  messaggi: MessaggioTs[];
}

export function registerSistemaTsRoutes(app: Express) {
  app.get("/api/sistema-ts/stato", (_req, res) => {
    let certificato = false;
    try {
      certificato = !!caricaChiaveTs();
    } catch (error) {
      logError("Certificato Sistema TS non leggibile:", error);
    }
    res.json({
      ambiente: ambienteTs(),
      certificatoConfigurato: certificato,
      maxDocumentiPerInvio: MAX_DOCUMENTI_PER_INVIO,
      demo: invioDisattivato,
    });
  });

  app.post("/api/sistema-ts/invia", async (req, res) => {
    if (invioDisattivato) return res.status(403).json({ error: "Nella demo l'invio al Sistema TS è disattivato" });
    const parsed = invioSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Dati non validi" });
    const { credenziali, documentoIds } = parsed.data;

    try {
      const documenti = await Promise.all(Array.from(new Set(documentoIds)).map((id) => storage.getDocumentoSpesa(id)));
      if (documenti.some((d) => !d || d.ambulatorioId !== req.user!.ambulatorioId)) {
        return res.status(404).json({ error: "Documento non trovato" });
      }
      const docs = documenti as NonNullable<(typeof documenti)[number]>[];
      if (new Set(docs.map((d) => d.emittenteId)).size > 1) {
        return res.status(400).json({ error: "Ogni invio riguarda un solo medico: le credenziali Sistema TS sono personali" });
      }
      if (!docs.every((d) => puoGestireDocumento(req, d))) {
        return res.status(403).json({ error: "Solo il medico emittente o un amministratore può inviare questi documenti" });
      }
      const nonInviabili = docs.filter((d) => d.statoTs !== "da_inviare" && d.statoTs !== "errore");
      if (nonInviabili.length > 0) {
        return res.status(409).json({ error: `La fattura n. ${nonInviabili[0].numero}/${nonInviabili[0].anno} è già inviata o esclusa` });
      }

      let chiave;
      try {
        chiave = caricaChiaveTs();
      } catch (error) {
        logError("Certificato Sistema TS non leggibile:", error);
        return res.status(503).json({ error: "Il certificato di cifratura del Sistema TS non è leggibile" });
      }
      if (!chiave) {
        return res.status(503).json({
          error: "Certificato di cifratura del Sistema TS non configurato (TS_CERT_PATH o TS_CERT_PEM): l'invio non è disponibile",
        });
      }

      const pincodeCifrato = cifra(credenziali.pincode, chiave);
      const risultati: RisultatoInvio[] = [];
      for (const doc of docs) {
        let esito: RisultatoInvio;
        try {
          const xml = buildInserimentoXml(doc, {
            pincode: pincodeCifrato,
            cfProprietario: cifra(doc.cfEmittente, chiave),
            cfCittadino: doc.flagOpposizione ? undefined : cifra(doc.cfPaziente, chiave),
          });
          const risposta = await inviaInserimento(xml, credenziali);
          const accolto = risposta.esitoChiamata === 0 || risposta.esitoChiamata === 2;
          const messaggi = risposta.fault
            ? [{ codice: "SOAP", descrizione: risposta.fault, tipo: "E" }]
            : risposta.messaggi;
          esito = {
            id: doc.id, numero: doc.numero, anno: doc.anno,
            statoTs: accolto ? "inviato" : "errore",
            esitoTs: risposta.esitoChiamata,
            protocolloTs: accolto ? risposta.protocollo : null,
            messaggi,
          };
        } catch (error: any) {
          esito = {
            id: doc.id, numero: doc.numero, anno: doc.anno,
            statoTs: "errore", esitoTs: null, protocolloTs: null,
            messaggi: [{ codice: "APP", descrizione: error?.message ?? "Errore di invio", tipo: "E" }],
          };
        }
        await storage.registraEsitoTs(doc.id, {
          statoTs: esito.statoTs,
          esitoTs: esito.esitoTs,
          protocolloTs: esito.protocolloTs,
          messaggiTs: esito.messaggi,
        });
        risultati.push(esito);
        // Stop at rejected credentials: retrying the rest of the batch would only lock the account.
        if (esito.messaggi.some((m) => m.descrizione === "Credenziali Sistema TS rifiutate")) break;
      }
      res.json({ ambiente: ambienteTs(), risultati });
    } catch (error) {
      // Only the error object is logged: the request body with the credentials never reaches the log.
      logError("Errore invio Sistema TS:", error);
      res.status(500).json({ error: "Errore durante l'invio al Sistema TS" });
    }
  });
}
