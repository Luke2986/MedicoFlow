import type { Request } from "express";
import { storage } from "../storage";

export async function pazienteInClinic(req: Request, pazienteId: string): Promise<boolean> {
  const paziente = await storage.getPaziente(pazienteId);
  return !!paziente && paziente.ambulatorioId === req.user!.ambulatorioId;
}

/** A requested medico must belong to the caller's clinic; without one, the caller (or the first doctor, for front-desk staff) is used. */
export async function resolveMedicoId(req: Request, requested: string | undefined): Promise<string | null> {
  const ambulatorioId = req.user!.ambulatorioId;
  if (requested) {
    const medico = await storage.getUser(requested);
    return medico && medico.ambulatorioId === ambulatorioId ? medico.id : null;
  }
  if (req.user!.ruolo !== "segreteria") return req.user!.id;
  const medici = (await storage.getUsersByAmbulatorio(ambulatorioId)).filter((u) => u.ruolo !== "segreteria");
  return medici[0]?.id ?? null;
}
