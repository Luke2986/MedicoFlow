import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import type { DocumentoSpesa, Visita } from "@shared/schema";
import {
  FLAG_INTRAMOENIA,
  IMPORTO_BOLLO_CENTESIMI,
  METODI_PAGAMENTO,
  TIPI_SPESA_MEDICO,
  formatEuro,
  richiedeBollo,
  type MetodoPagamento,
  type TipoSpesaMedico,
} from "@shared/fiscale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoceForm {
  tipoSpesa: TipoSpesaMedico;
  intramoenia: boolean;
  descrizione: string;
  importo: string;
}

export function messaggioErrore(error: Error): string {
  const raw = error.message.replace(/^\d+: /, "");
  try {
    return JSON.parse(raw).error ?? raw;
  } catch {
    return raw;
  }
}

function euroToCentesimi(value: string): number {
  const n = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}

const oggi = () => format(new Date(), "yyyy-MM-dd");

interface Props {
  pazienteId: string;
  visita?: Visita;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmettiFatturaDialog({ pazienteId, visita, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [dataEmissione, setDataEmissione] = useState(oggi());
  const [dataPagamento, setDataPagamento] = useState(oggi());
  const [metodo, setMetodo] = useState<MetodoPagamento>("pos");
  const [opposizione, setOpposizione] = useState(false);
  const [voci, setVoci] = useState<VoceForm[]>([]);
  const [errore, setErrore] = useState("");

  useEffect(() => {
    if (!open) return;
    setDataEmissione(oggi());
    setDataPagamento(oggi());
    setMetodo("pos");
    setOpposizione(false);
    setErrore("");
    const descrizione = visita
      ? `Visita del ${format(new Date(visita.dataVisita), "dd/MM/yyyy")} – ${visita.motivoVisita}`
      : "Visita specialistica";
    setVoci([{ tipoSpesa: "SR", intramoenia: false, descrizione, importo: "" }]);
  }, [open, visita]);

  const centesimi = voci.map((v) => euroToCentesimi(v.importo));
  const totale = centesimi.reduce((s, c) => s + (Number.isFinite(c) ? c : 0), 0);
  const bollo = richiedeBollo(totale, "N4");

  const emetti = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/documenti-spesa", {
        pazienteId,
        visitaId: visita?.id,
        emittenteId: visita?.medicoId,
        dataEmissione,
        dataPagamento,
        metodoPagamento: metodo,
        flagOpposizione: opposizione,
        voci: voci.map((v, i) => ({
          tipoSpesa: v.tipoSpesa,
          ...(v.intramoenia && v.tipoSpesa === "SR" ? { flagTipoSpesa: FLAG_INTRAMOENIA } : {}),
          descrizione: v.descrizione,
          importoCentesimi: centesimi[i],
        })),
      });
      return (await res.json()) as DocumentoSpesa;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ["/api/documenti-spesa"] });
      toast({ title: `Fattura n. ${doc.numero}/${doc.anno} emessa` });
      onOpenChange(false);
      window.open(`/api/documenti-spesa/${doc.id}/pdf`, "_blank");
    },
    onError: (error: Error) => setErrore(messaggioErrore(error)),
  });

  const aggiornaVoce = (i: number, patch: Partial<VoceForm>) =>
    setVoci((prev) => prev.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  const importiValidi = centesimi.every((c) => Number.isFinite(c) && c > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Emetti fattura sanitaria</DialogTitle>
          <DialogDescription>
            Fattura al paziente, fuori dal Sistema di Interscambio. La spesa sarà da inviare al Sistema TS, salvo opposizione.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="data-emissione">Data emissione</Label>
            <Input id="data-emissione" type="date" value={dataEmissione} onChange={(e) => setDataEmissione(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="data-pagamento">Data pagamento</Label>
            <Input id="data-pagamento" type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPagamento)}>
              <SelectTrigger data-testid="select-metodo-pagamento">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METODI_PAGAMENTO).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {metodo === "contanti" && (
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Pagamento non tracciato: dal 2020 la detrazione al 19% per il paziente richiede, di norma, un pagamento tracciabile.
          </p>
        )}

        <div className="space-y-3">
          {voci.map((v, i) => (
            <div key={i} className="rounded-md border p-3 space-y-3">
              <div className="grid sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
                <div className="space-y-2">
                  <Label>Tipo spesa</Label>
                  <Select value={v.tipoSpesa} onValueChange={(t) => aggiornaVoce(i, { tipoSpesa: t as TipoSpesaMedico })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPI_SPESA_MEDICO).map(([k, label]) => (
                        <SelectItem key={k} value={k}>
                          {k} – {label.length > 60 ? `${label.slice(0, 60)}…` : label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`importo-${i}`}>Importo (€)</Label>
                  <Input
                    id={`importo-${i}`}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={v.importo}
                    onChange={(e) => aggiornaVoce(i, { importo: e.target.value })}
                    data-testid={`input-importo-${i}`}
                  />
                </div>
                {voci.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setVoci((prev) => prev.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`descrizione-${i}`}>Descrizione</Label>
                <Input id={`descrizione-${i}`} value={v.descrizione} onChange={(e) => aggiornaVoce(i, { descrizione: e.target.value })} />
              </div>
              {v.tipoSpesa === "SR" && (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={v.intramoenia} onCheckedChange={(c) => aggiornaVoce(i, { intramoenia: c === true })} />
                  Prestazione in intramoenia
                </label>
              )}
            </div>
          ))}
          {voci.length < 20 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVoci((prev) => [...prev, { tipoSpesa: "SR", intramoenia: false, descrizione: "", importo: "" }])}
            >
              <Plus className="h-4 w-4 mr-2" /> Aggiungi voce
            </Button>
          )}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={opposizione} onCheckedChange={(c) => setOpposizione(c === true)} className="mt-0.5" />
          <span>Il paziente si oppone all'invio di questa spesa al Sistema Tessera Sanitaria</span>
        </label>

        <div className="rounded-md bg-muted p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Totale prestazioni</span>
            <span>{formatEuro(totale)}</span>
          </div>
          {bollo && (
            <div className="flex justify-between text-muted-foreground">
              <span>Imposta di bollo (importo senza IVA sopra 77,47 €)</span>
              <span>{formatEuro(IMPORTO_BOLLO_CENTESIMI)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Totale documento</span>
            <span>{formatEuro(totale + (bollo ? IMPORTO_BOLLO_CENTESIMI : 0))}</span>
          </div>
        </div>

        {errore && (
          <Alert variant="destructive">
            <AlertDescription>
              {errore}
              {errore.includes("Dati fiscali") && (
                <Link href="/dashboard/impostazioni/dati-fiscali" className="block mt-1 underline font-medium">
                  Vai ai dati fiscali
                </Link>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={() => emetti.mutate()} disabled={emetti.isPending || !importiValidi} data-testid="button-emetti-fattura">
            Emetti e scarica PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
