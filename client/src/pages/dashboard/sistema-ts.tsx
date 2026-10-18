import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, Download, Send, ShieldCheck } from "lucide-react";
import type { DocumentoSpesa, MessaggioTs } from "@shared/schema";
import { METODI_PAGAMENTO, formatEuro, totaleVociCentesimi, type MetodoPagamento } from "@shared/fiscale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useUser } from "@/lib/useUser";
import { STATO_TS_BADGE } from "./fatture";

type DocumentoRow = DocumentoSpesa & { pazienteNome: string; emittenteNome: string };

interface Member {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
}

interface StatoTs {
  ambiente: "test" | "prod";
  certificatoConfigurato: boolean;
  maxDocumentiPerInvio: number;
  demo: boolean;
}

interface Risultato {
  id: string;
  numero: number;
  anno: number;
  statoTs: string;
  protocolloTs: string | null;
  messaggi: MessaggioTs[];
}

function csvCell(value: string | number) {
  const s = String(value);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function esportaCsv(documenti: DocumentoRow[], anno: string) {
  const header = ["Numero", "Data emissione", "Data pagamento", "Paziente", "CF paziente", "Medico", "P.IVA", "Importo", "Natura IVA", "Pagamento", "Tracciato", "Opposizione", "Stato TS", "Protocollo"];
  const rows = documenti.map((d) => [
    `${d.numero}/${d.anno}`,
    d.dataEmissione,
    d.dataPagamento,
    d.pazienteNome,
    d.cfPaziente,
    d.emittenteNome,
    d.pivaEmittente,
    (totaleVociCentesimi(d.voci) / 100).toFixed(2).replace(".", ","),
    d.naturaIva,
    METODI_PAGAMENTO[d.metodoPagamento as MetodoPagamento] ?? d.metodoPagamento,
    d.metodoPagamento === "contanti" ? "NO" : "SI",
    d.flagOpposizione ? "SI" : "NO",
    STATO_TS_BADGE[d.statoTs]?.label ?? d.statoTs,
    d.protocolloTs ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `spese-sanitarie-${anno}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SistemaTsPage() {
  const { user, isAdmin } = useUser();
  const annoCorrente = new Date().getFullYear();
  // Expenses of year N are sent by 31 January of N+1, so in January the default is the previous year.
  const [anno, setAnno] = useState(String(new Date().getMonth() === 0 ? annoCorrente - 1 : annoCorrente));
  const [medicoScelto, setMedicoScelto] = useState("");
  const [utente, setUtente] = useState("");
  const [password, setPassword] = useState("");
  const [pincode, setPincode] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [avanzamento, setAvanzamento] = useState(0);
  const [risultati, setRisultati] = useState<Risultato[]>([]);
  const [errore, setErrore] = useState("");

  const { data: stato } = useQuery<StatoTs>({ queryKey: ["/api/sistema-ts/stato"] });
  const { data: members = [] } = useQuery<Member[]>({ queryKey: ["/api/team"] });
  const medici = members.filter((m) => m.ruolo !== "segreteria");
  const emittenteId = medicoScelto || (user && user.ruolo !== "segreteria" ? user.id : medici[0]?.id ?? "");

  const { data: documenti = [] } = useQuery<DocumentoRow[]>({
    queryKey: ["/api/documenti-spesa", { anno, emittenteId, vista: "ts" }],
    queryFn: async () => {
      const res = await fetch(`/api/documenti-spesa?anno=${anno}&emittenteId=${emittenteId}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
    enabled: !!emittenteId,
  });

  const daInviare = useMemo(() => documenti.filter((d) => d.statoTs === "da_inviare" || d.statoTs === "errore"), [documenti]);
  const conteggi = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of documenti) c[d.statoTs] = (c[d.statoTs] ?? 0) + 1;
    return c;
  }, [documenti]);
  const opposizioni = documenti.filter((d) => d.flagOpposizione).length;
  const puoInviare = isAdmin || user?.id === emittenteId;
  const scadenza = `31/01/${Number(anno) + 1}`;

  const invia = async () => {
    setErrore("");
    setRisultati([]);
    setInCorso(true);
    setAvanzamento(0);
    const max = stato?.maxDocumentiPerInvio ?? 20;
    const ids = daInviare.map((d) => d.id);
    const tutti: Risultato[] = [];
    try {
      for (let i = 0; i < ids.length; i += max) {
        const res = await fetch("/api/sistema-ts/invia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credenziali: { utente, password, pincode }, documentoIds: ids.slice(i, i + max) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Invio non riuscito");
        tutti.push(...data.risultati);
        setRisultati([...tutti]);
        setAvanzamento(Math.min(100, Math.round(((i + max) / ids.length) * 100)));
        if (data.risultati.some((r: Risultato) => r.messaggi.some((m) => m.descrizione === "Credenziali Sistema TS rifiutate"))) {
          throw new Error("Credenziali Sistema TS rifiutate: invio interrotto");
        }
      }
    } catch (e: any) {
      setErrore(e.message);
    } finally {
      setPassword("");
      setPincode("");
      setInCorso(false);
      setAvanzamento(100);
      queryClient.invalidateQueries({ queryKey: ["/api/documenti-spesa"] });
    }
  };

  const anni = Array.from({ length: 4 }, (_, i) => String(annoCorrente - i));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sistema Tessera Sanitaria</h1>
        <p className="text-muted-foreground mt-1">Invio delle spese sanitarie dei pazienti per la dichiarazione precompilata</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Alert>
          <CalendarClock className="h-4 w-4" />
          <AlertDescription>
            Le spese del {anno} vanno inviate entro il <strong>{scadenza}</strong> (invio annuale, D.Lgs. 81/2025).
          </AlertDescription>
        </Alert>
        {stato?.demo && (
          <Alert data-testid="alert-stato-ts">
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo pubblica:</strong> l'invio al Sistema TS è disattivato e non vanno inserite credenziali reali. Riepilogo ed
              export CSV funzionano sui dati di esempio.
            </AlertDescription>
          </Alert>
        )}
        {stato && !stato.demo && (
          <Alert variant={stato.certificatoConfigurato ? "default" : "destructive"} data-testid="alert-stato-ts">
            {stato.certificatoConfigurato ? <ShieldCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>
              Ambiente: <strong>{stato.ambiente === "prod" ? "produzione" : "test"}</strong>.{" "}
              {stato.certificatoConfigurato
                ? "Certificato di cifratura configurato."
                : "Certificato di cifratura non configurato: l'invio diretto non è disponibile. Puoi esportare il CSV di riepilogo."}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Riepilogo</CardTitle>
            <CardDescription>Le credenziali Sistema TS sono personali: si invia un medico alla volta.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={anno} onValueChange={setAnno}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anni.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={emittenteId} onValueChange={setMedicoScelto}>
              <SelectTrigger className="w-52" data-testid="select-medico-ts">
                <SelectValue placeholder="Medico" />
              </SelectTrigger>
              <SelectContent>
                {medici.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.cognome} {m.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => esportaCsv(documenti, anno)} disabled={documenti.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Esporta CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            {Object.entries(STATO_TS_BADGE).map(([k, v]) => (
              <div key={k} className="rounded-md border p-3">
                <p className="text-muted-foreground">{v.label}</p>
                <p className="text-xl font-semibold" data-testid={`count-ts-${k}`}>{conteggi[k] ?? 0}</p>
              </div>
            ))}
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">Con opposizione</p>
              <p className="text-xl font-semibold">{opposizioni}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invio</CardTitle>
          <CardDescription>
            Credenziali e pincode servono solo per questo invio: non vengono salvati da MedicoFlow. Il pincode è cifrato prima di
            lasciare il server.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stato?.demo ? (
            <p className="text-sm text-muted-foreground" data-testid="text-ts-demo">
              Nella demo il modulo di invio è nascosto. Con un database reale, il certificato del kit Sistema TS e le credenziali del
              medico, da qui si inviano i {daInviare.length} documenti da inviare, a blocchi di {stato.maxDocumentiPerInvio}.
            </p>
          ) : !puoInviare ? (
            <p className="text-sm text-muted-foreground">Solo il medico emittente o un amministratore può inviare le sue spese.</p>
          ) : (
            <>
              <form
                className="grid sm:grid-cols-3 gap-4"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  invia();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="ts-utente">Utente Sistema TS</Label>
                  <Input id="ts-utente" value={utente} onChange={(e) => setUtente(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ts-password">Password</Label>
                  <Input id="ts-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ts-pincode">Pincode</Label>
                  <Input id="ts-pincode" type="password" value={pincode} onChange={(e) => setPincode(e.target.value)} autoComplete="off" />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    type="submit"
                    disabled={inCorso || daInviare.length === 0 || !utente || !password || !pincode || !stato?.certificatoConfigurato}
                    data-testid="button-invia-ts"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Invia {daInviare.length} {daInviare.length === 1 ? "documento" : "documenti"}
                  </Button>
                </div>
              </form>
              {(inCorso || risultati.length > 0) && <Progress value={avanzamento} className="h-2" />}
            </>
          )}

          {errore && (
            <Alert variant="destructive">
              <AlertDescription>{errore}</AlertDescription>
            </Alert>
          )}

          {risultati.length > 0 && (
            <div className="space-y-2">
              {risultati.map((r) => (
                <div key={r.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <strong>Fattura n. {r.numero}/{r.anno}</strong>
                    <Badge variant="outline" className={STATO_TS_BADGE[r.statoTs]?.className}>{STATO_TS_BADGE[r.statoTs]?.label ?? r.statoTs}</Badge>
                    {r.protocolloTs && <span className="text-muted-foreground">Prot. {r.protocolloTs}</span>}
                  </div>
                  {r.messaggi.map((m, i) => (
                    <p key={i} className={m.tipo === "E" ? "text-destructive" : "text-muted-foreground"}>
                      [{m.codice}] {m.descrizione}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {daInviare.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2">Da inviare ({daInviare.length})</p>
              <ul className="space-y-1 text-muted-foreground">
                {daInviare.slice(0, 50).map((d) => (
                  <li key={d.id}>
                    n. {d.numero}/{d.anno} · {d.pazienteNome} · {formatEuro(totaleVociCentesimi(d.voci))}
                    {d.statoTs === "errore" && d.messaggiTs?.[0] && (
                      <span className="text-destructive"> · ultimo errore: {d.messaggiTs[0].descrizione}</span>
                    )}
                  </li>
                ))}
              </ul>
              {daInviare.length > 50 && <p className="text-muted-foreground mt-1">…e altri {daInviare.length - 50}.</p>}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Le fatture si emettono dalla scheda del paziente. <Link href="/dashboard/fatture" className="underline">Vai alle fatture</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
