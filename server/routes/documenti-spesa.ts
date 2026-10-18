import type { Express, Request, Response } from "express";
import { z } from "zod";
import { renderToStream } from "@react-pdf/renderer";
import { ownsRecord } from "../authz";
import { storage } from "../storage";
import { logError } from "../log";
import { resolveMedicoId } from "./helpers";
import { validateCodiceFiscale } from "../../shared/validators";
import {
  FLAG_INTRAMOENIA,
  METODI_PAGAMENTO,
  NATURE_IVA,
  REGIMI_FISCALI,
  TIPI_SPESA_MEDICO,
  richiedeBollo,
  totaleVociCentesimi,
  validaDocumento,
} from "../../shared/fiscale";
import type { DocumentoSpesa } from "../../shared/schema";
import FatturaPDF from "../../client/src/lib/pdf/fattura-pdf";

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida (AAAA-MM-GG)");
const enumKeys = <T extends Record<string, unknown>>(obj: T) => Object.keys(obj) as [keyof T & string, ...(keyof T & string)[]];

const voceSchema = z.object({
  tipoSpesa: z.enum(enumKeys(TIPI_SPESA_MEDICO), { errorMap: () => ({ message: "Tipo di spesa non ammesso per un medico (ammessi: SR, IC, AA)" }) }),
  flagTipoSpesa: z.literal(FLAG_INTRAMOENIA).optional(),
  descrizione: z.string().trim().min(1, "Descrizione obbligatoria").max(200),
  importoCentesimi: z.number().int(),
});

const documentoBase = {
  dataPagamento: dataIso,
  metodoPagamento: z.enum(enumKeys(METODI_PAGAMENTO), { errorMap: () => ({ message: "Metodo di pagamento non valido" }) }),
  voci: z.array(voceSchema).min(1, "Serve almeno una voce di spesa").max(20),
  naturaIva: z.enum(enumKeys(NATURE_IVA), { errorMap: () => ({ message: "Natura IVA non valida" }) }).optional(),
  flagOpposizione: z.boolean().default(false),
};

const creaDocumentoSchema = z.object({
  pazienteId: z.string().min(1),
  visitaId: z.string().optional(),
  emittenteId: z.string().optional(),
  dataEmissione: dataIso,
  ...documentoBase,
});

const modificaDocumentoSchema = z.object({
  ...documentoBase,
  dataPagamento: dataIso.optional(),
  metodoPagamento: documentoBase.metodoPagamento.optional(),
  voci: documentoBase.voci.optional(),
  flagOpposizione: z.boolean().optional(),
  escluso: z.boolean().optional(),
});

const datiFiscaliSchema = z.object({
  codiceFiscale: z
    .string()
    .trim()
    .toUpperCase()
    .refine((cf) => cf === "" || validateCodiceFiscale(cf), "Codice fiscale non valido"),
  partitaIva: z.string().trim().regex(/^(\d{11})?$/, "La partita IVA deve avere 11 cifre"),
  regimeFiscale: z.enum(enumKeys(REGIMI_FISCALI)).nullable(),
  naturaIvaDefault: z.enum(enumKeys(NATURE_IVA)),
});

function primoErrore(error: z.ZodError) {
  return error.issues[0]?.message ?? "Dati non validi";
}

/** Only an admin or the issuing doctor may change or send a fiscal document. */
export function puoGestireDocumento(req: Request, doc: Pick<DocumentoSpesa, "emittenteId">) {
  return req.user!.ruolo === "admin" || req.user!.id === doc.emittenteId;
}

async function caricaMembro(req: Request, res: Response, id: string) {
  const membro = await storage.getUser(id);
  if (!membro || membro.ambulatorioId !== req.user!.ambulatorioId) {
    res.status(404).json({ error: "Utente non trovato" });
    return null;
  }
  return membro;
}

export function registerDocumentoSpesaRoutes(app: Express) {
  app.get("/api/team/:id/fiscale", async (req, res) => {
    try {
      const membro = await caricaMembro(req, res, req.params.id);
      if (!membro) return;
      if (req.user!.ruolo !== "admin" && req.user!.id !== membro.id) {
        return res.status(403).json({ error: "Puoi vedere solo i tuoi dati fiscali" });
      }
      res.json({
        codiceFiscale: membro.codiceFiscale,
        partitaIva: membro.partitaIva,
        regimeFiscale: membro.regimeFiscale,
        naturaIvaDefault: membro.naturaIvaDefault,
      });
    } catch (error) {
      logError("Errore lettura dati fiscali:", error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.put("/api/team/:id/fiscale", async (req, res) => {
    const parsed = datiFiscaliSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primoErrore(parsed.error) });
    try {
      const membro = await caricaMembro(req, res, req.params.id);
      if (!membro) return;
      if (req.user!.ruolo !== "admin" && req.user!.id !== membro.id) {
        return res.status(403).json({ error: "Puoi modificare solo i tuoi dati fiscali" });
      }
      if (membro.ruolo === "segreteria") {
        return res.status(400).json({ error: "La segreteria non emette documenti fiscali" });
      }
      const d = parsed.data;
      const aggiornato = await storage.updateUserFiscale(membro.id, {
        codiceFiscale: d.codiceFiscale || null,
        partitaIva: d.partitaIva || null,
        regimeFiscale: d.regimeFiscale,
        naturaIvaDefault: d.naturaIvaDefault,
      });
      res.json({
        codiceFiscale: aggiornato.codiceFiscale,
        partitaIva: aggiornato.partitaIva,
        regimeFiscale: aggiornato.regimeFiscale,
        naturaIvaDefault: aggiornato.naturaIvaDefault,
      });
    } catch (error) {
      logError("Errore salvataggio dati fiscali:", error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.get("/api/documenti-spesa", async (req, res) => {
    try {
      const { anno, emittenteId, pazienteId, statoTs } = req.query;
      const documenti = await storage.getDocumentiSpesa(req.user!.ambulatorioId, {
        anno: typeof anno === "string" && /^\d{4}$/.test(anno) ? Number(anno) : undefined,
        emittenteId: typeof emittenteId === "string" && emittenteId ? emittenteId : undefined,
        pazienteId: typeof pazienteId === "string" && pazienteId ? pazienteId : undefined,
        statoTs: typeof statoTs === "string" && statoTs ? statoTs : undefined,
      });
      res.json(documenti);
    } catch (error) {
      logError("Errore elenco documenti di spesa:", error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.get("/api/documenti-spesa/:id", async (req, res) => {
    try {
      const doc = await storage.getDocumentoSpesa(req.params.id);
      if (!ownsRecord(req, res, doc, "Documento non trovato")) return;
      res.json(doc);
    } catch (error) {
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.post("/api/documenti-spesa", async (req, res) => {
    const parsed = creaDocumentoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primoErrore(parsed.error) });
    const d = parsed.data;
    try {
      const paziente = await storage.getPaziente(d.pazienteId);
      if (!paziente || paziente.ambulatorioId !== req.user!.ambulatorioId) {
        return res.status(404).json({ error: "Paziente non trovato" });
      }
      if (d.visitaId) {
        const visita = await storage.getVisita(d.visitaId);
        if (!visita || visita.ambulatorioId !== req.user!.ambulatorioId || visita.pazienteId !== paziente.id) {
          return res.status(404).json({ error: "Visita non trovata" });
        }
      }
      const emittenteId = await resolveMedicoId(req, d.emittenteId);
      const emittente = emittenteId ? await storage.getUser(emittenteId) : undefined;
      if (!emittente || emittente.ruolo === "segreteria") {
        return res.status(400).json({ error: "Medico emittente non valido" });
      }
      if (req.user!.ruolo === "medico" && emittente.id !== req.user!.id) {
        return res.status(403).json({ error: "Un medico può emettere fatture solo a proprio nome" });
      }

      const errori = validaDocumento({
        dataEmissione: d.dataEmissione,
        dataPagamento: d.dataPagamento,
        voci: d.voci,
        cfEmittente: emittente.codiceFiscale,
        pivaEmittente: emittente.partitaIva,
        cfPaziente: paziente.codiceFiscale,
        nomeEmittente: `${emittente.nome} ${emittente.cognome}`,
      });
      if (errori.length > 0) return res.status(400).json({ error: errori[0], errori });

      const naturaIva = d.naturaIva ?? emittente.naturaIvaDefault ?? "N4";
      const doc = await storage.createDocumentoSpesa({
        ambulatorioId: req.user!.ambulatorioId,
        emittenteId: emittente.id,
        pazienteId: paziente.id,
        visitaId: d.visitaId ?? null,
        anno: Number(d.dataEmissione.slice(0, 4)),
        tipoDocumento: "F",
        dataEmissione: d.dataEmissione,
        dataPagamento: d.dataPagamento,
        metodoPagamento: d.metodoPagamento,
        voci: d.voci,
        naturaIva,
        bollo: richiedeBollo(totaleVociCentesimi(d.voci), naturaIva),
        flagOpposizione: d.flagOpposizione,
        cfEmittente: emittente.codiceFiscale!,
        pivaEmittente: emittente.partitaIva!,
        cfPaziente: paziente.codiceFiscale,
        statoTs: "da_inviare",
      });
      res.status(201).json(doc);
    } catch (error) {
      logError("Errore emissione documento di spesa:", error);
      res.status(500).json({ error: "Errore durante l'emissione del documento" });
    }
  });

  app.patch("/api/documenti-spesa/:id", async (req, res) => {
    const parsed = modificaDocumentoSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: primoErrore(parsed.error) });
    try {
      const doc = await storage.getDocumentoSpesa(req.params.id);
      if (!ownsRecord(req, res, doc, "Documento non trovato")) return;
      if (!puoGestireDocumento(req, doc)) {
        return res.status(403).json({ error: "Solo il medico emittente o un amministratore può modificare il documento" });
      }
      if (doc.statoTs === "inviato") {
        return res.status(409).json({ error: "Il documento è già stato inviato al Sistema TS e non può essere modificato" });
      }
      const d = parsed.data;
      const voci = d.voci ?? doc.voci;
      const dataPagamento = d.dataPagamento ?? doc.dataPagamento;
      const errori = validaDocumento({
        dataEmissione: doc.dataEmissione,
        dataPagamento,
        voci,
        cfEmittente: doc.cfEmittente,
        pivaEmittente: doc.pivaEmittente,
        cfPaziente: doc.cfPaziente,
      });
      if (errori.length > 0) return res.status(400).json({ error: errori[0], errori });
      const naturaIva = d.naturaIva ?? doc.naturaIva;
      const aggiornato = await storage.updateDocumentoSpesa(doc.id, {
        dataPagamento,
        metodoPagamento: d.metodoPagamento ?? doc.metodoPagamento,
        voci,
        naturaIva,
        bollo: richiedeBollo(totaleVociCentesimi(voci), naturaIva),
        flagOpposizione: d.flagOpposizione ?? doc.flagOpposizione,
        ...(d.escluso === undefined ? {} : { statoTs: d.escluso ? "escluso" : "da_inviare" }),
      });
      res.json(aggiornato);
    } catch (error) {
      logError("Errore modifica documento di spesa:", error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.delete("/api/documenti-spesa/:id", async (req, res) => {
    try {
      const doc = await storage.getDocumentoSpesa(req.params.id);
      if (!ownsRecord(req, res, doc, "Documento non trovato")) return;
      if (!puoGestireDocumento(req, doc)) {
        return res.status(403).json({ error: "Solo il medico emittente o un amministratore può eliminare il documento" });
      }
      if (doc.statoTs === "inviato") {
        return res.status(409).json({ error: "Il documento è già stato inviato al Sistema TS e non può essere eliminato" });
      }
      // Deleting anything but the latest number would leave a gap in the invoice sequence.
      const stessaSerie = await storage.getDocumentiSpesa(doc.ambulatorioId, { anno: doc.anno, emittenteId: doc.emittenteId });
      if (stessaSerie.some((d) => d.numero > doc.numero)) {
        return res.status(409).json({ error: "Si può eliminare solo l'ultima fattura emessa: per le altre serve una nota di credito" });
      }
      await storage.deleteDocumentoSpesa(doc.id);
      res.status(204).send();
    } catch (error) {
      logError("Errore eliminazione documento di spesa:", error);
      res.status(500).json({ error: "Errore server" });
    }
  });

  app.get("/api/documenti-spesa/:id/pdf", async (req, res) => {
    try {
      const doc = await storage.getDocumentoSpesa(req.params.id);
      if (!ownsRecord(req, res, doc, "Documento non trovato")) return;
      const [paziente, ambulatorio, emittente] = await Promise.all([
        storage.getPaziente(doc.pazienteId),
        storage.getAmbulatorio(doc.ambulatorioId),
        storage.getUser(doc.emittenteId),
      ]);
      if (!paziente || !ambulatorio || !emittente) {
        return res.status(404).json({ error: "Dati del documento incompleti" });
      }
      const pdfStream = await renderToStream(FatturaPDF({ documento: doc, paziente, ambulatorio, emittente }));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Fattura_${doc.numero}_${doc.anno}_${paziente.cognome}.pdf"`);
      pdfStream.pipe(res);
    } catch (error) {
      logError("Errore PDF fattura:", error);
      res.status(500).json({ error: "Errore durante la generazione del PDF" });
    }
  });
}
