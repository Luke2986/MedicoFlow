import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Receipt, Trash2, Ban, Undo2 } from "lucide-react";
import type { DocumentoSpesa } from "@shared/schema";
import { IMPORTO_BOLLO_CENTESIMI, METODI_PAGAMENTO, formatEuro, totaleVociCentesimi, type MetodoPagamento } from "@shared/fiscale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/useUser";
import { messaggioErrore } from "@/components/fiscale/EmettiFatturaDialog";

type DocumentoRow = DocumentoSpesa & { pazienteNome: string; emittenteNome: string };

interface Member {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
}

export const STATO_TS_BADGE: Record<string, { label: string; className: string }> = {
  da_inviare: { label: "Da inviare", className: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100" },
  inviato: { label: "Inviato", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100" },
  errore: { label: "Errore", className: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-100" },
  escluso: { label: "Escluso", className: "bg-muted text-muted-foreground" },
};

const TUTTI = "tutti";

export default function FatturePage() {
  const { toast } = useToast();
  const { user } = useUser();
  const annoCorrente = new Date().getFullYear();
  const [anno, setAnno] = useState(String(annoCorrente));
  const [emittenteId, setEmittenteId] = useState(TUTTI);
  const [stato, setStato] = useState(TUTTI);

  const { data: members = [] } = useQuery<Member[]>({ queryKey: ["/api/team"] });
  const medici = members.filter((m) => m.ruolo !== "segreteria");

  const filtri = { anno, emittenteId, stato };
  const { data: documenti = [], isLoading } = useQuery<DocumentoRow[]>({
    queryKey: ["/api/documenti-spesa", filtri],
    queryFn: async () => {
      const params = new URLSearchParams({ anno });
      if (emittenteId !== TUTTI) params.set("emittenteId", emittenteId);
      if (stato !== TUTTI) params.set("statoTs", stato);
      const res = await fetch(`/api/documenti-spesa?${params}`);
      if (!res.ok) throw new Error("Errore nel caricamento delle fatture");
      return res.json();
    },
  });

  const riepilogo = useMemo(() => {
    const conta: Record<string, number> = { da_inviare: 0, inviato: 0, errore: 0, escluso: 0 };
    let totale = 0;
    for (const d of documenti) {
      conta[d.statoTs] = (conta[d.statoTs] ?? 0) + 1;
      totale += totaleVociCentesimi(d.voci);
    }
    return { conta, totale };
  }, [documenti]);

  const onError = (error: Error) =>
    toast({ title: "Operazione non riuscita", description: messaggioErrore(error), variant: "destructive" });

  const escludi = useMutation({
    mutationFn: ({ id, escluso }: { id: string; escluso: boolean }) => apiRequest("PATCH", `/api/documenti-spesa/${id}`, { escluso }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/documenti-spesa"] }),
    onError,
  });

  const elimina = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/documenti-spesa/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documenti-spesa"] });
      toast({ title: "Fattura eliminata" });
    },
    onError,
  });

  const puoGestire = (d: DocumentoRow) => user?.ruolo === "admin" || user?.id === d.emittenteId;
  const anni = Array.from({ length: 5 }, (_, i) => String(annoCorrente - i));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fatture</h1>
          <p className="text-muted-foreground mt-1">
            Fatture sanitarie ai pazienti e stato dell'invio al Sistema Tessera Sanitaria. Si emettono dalla scheda del paziente,
            sulla visita.
          </p>
        </div>
        <Link href="/dashboard/impostazioni/dati-fiscali">
          <Button variant="outline">Dati fiscali</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Totale {anno}</p>
            <p className="text-lg font-semibold" data-testid="text-totale-fatture">{formatEuro(riepilogo.totale)}</p>
          </CardContent>
        </Card>
        {Object.entries(STATO_TS_BADGE).map(([k, v]) => (
          <Card key={k}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{v.label}</p>
              <p className="text-lg font-semibold">{riepilogo.conta[k] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Elenco</CardTitle>
            <CardDescription>Gli importi non includono l'imposta di bollo.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={anno} onValueChange={setAnno}>
              <SelectTrigger className="w-28" data-testid="select-anno-fatture">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anni.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={emittenteId} onValueChange={setEmittenteId}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TUTTI}>Tutti i medici</SelectItem>
                {medici.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.cognome} {m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stato} onValueChange={setStato}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TUTTI}>Tutti gli stati</SelectItem>
                {Object.entries(STATO_TS_BADGE).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Caricamento…</p>}
          {!isLoading && documenti.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Receipt className="h-8 w-8 mx-auto mb-2" />
              <p>Nessuna fattura per i filtri scelti.</p>
            </div>
          )}
          {documenti.length > 0 && (
            <div className="overflow-x-auto">
              <Table data-testid="table-fatture">
                <TableHeader>
                  <TableRow>
                    <TableHead>N.</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Paziente</TableHead>
                    <TableHead>Medico</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead>Sistema TS</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documenti.map((d) => {
                    const badge = STATO_TS_BADGE[d.statoTs] ?? STATO_TS_BADGE.da_inviare;
                    const gestibile = puoGestire(d) && d.statoTs !== "inviato";
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.numero}/{d.anno}</TableCell>
                        <TableCell className="whitespace-nowrap">{d.dataEmissione.split("-").reverse().join("/")}</TableCell>
                        <TableCell>{d.pazienteNome}</TableCell>
                        <TableCell>{d.emittenteNome}</TableCell>
                        <TableCell>{METODI_PAGAMENTO[d.metodoPagamento as MetodoPagamento] ?? d.metodoPagamento}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatEuro(totaleVociCentesimi(d.voci))}
                          {d.bollo && (
                            <span className="block text-xs text-muted-foreground">+ bollo {formatEuro(IMPORTO_BOLLO_CENTESIMI)}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={badge.className}>{badge.label}</Badge>
                          {d.flagOpposizione && <span className="block text-xs text-muted-foreground mt-1">Opposizione paziente</span>}
                          {d.protocolloTs && <span className="block text-xs text-muted-foreground mt-1">Prot. {d.protocolloTs}</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Scarica PDF"
                              onClick={() => window.open(`/api/documenti-spesa/${d.id}/pdf`, "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {gestibile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title={d.statoTs === "escluso" ? "Includi nell'invio al Sistema TS" : "Escludi dall'invio al Sistema TS"}
                                onClick={() => escludi.mutate({ id: d.id, escluso: d.statoTs !== "escluso" })}
                              >
                                {d.statoTs === "escluso" ? <Undo2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                              </Button>
                            )}
                            {gestibile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Elimina (solo l'ultima fattura emessa)"
                                onClick={() => {
                                  if (window.confirm(`Eliminare la fattura n. ${d.numero}/${d.anno}?`)) elimina.mutate(d.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
