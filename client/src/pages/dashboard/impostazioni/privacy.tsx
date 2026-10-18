import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUser } from "@/lib/useUser";

interface AiAuditRow {
  id: string;
  azione: string;
  provider: string;
  modello: string;
  byteAudio: number | null;
  esito: string;
  createdAt: string;
  utenteNome: string;
  pazienteNome: string | null;
}

const ESITI: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  ok: { label: "Completata", variant: "default" },
  negato_consenso: { label: "Bloccata: consenso mancante", variant: "outline" },
  errore: { label: "Errore", variant: "destructive" },
};

const AZIONI: Record<string, string> = {
  trascrizione: "Trascrizione",
  strutturazione: "Proposta referto",
  conferma_referto: "Revisione confermata",
};

function formatBytes(bytes: number | null) {
  if (bytes == null) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AuditAi() {
  const { data = [], isLoading, isError } = useQuery<AiAuditRow[]>({
    queryKey: ["/api/ai/audit"],
    queryFn: async () => {
      const res = await fetch("/api/ai/audit");
      if (!res.ok) throw new Error("Errore nel caricamento del registro");
      return res.json();
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro utilizzo AI</CardTitle>
        <CardDescription>
          Ultime 200 operazioni AI dell'ambulatorio: trascrizioni, proposte di referto e revisioni confermate. Il registro non contiene né l'audio né il testo trascritto.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Caricamento…</p>}
        {isError && <p className="text-sm text-destructive">Impossibile caricare il registro.</p>}
        {!isLoading && !isError && data.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="text-audit-vuoto">Nessuna richiesta registrata.</p>
        )}
        {data.length > 0 && (
          <div className="overflow-x-auto">
            <Table data-testid="table-audit-ai">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Azione</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead className="text-right">Audio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => {
                  const esito = ESITI[row.esito] ?? { label: row.esito, variant: "secondary" as const };
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(row.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                      </TableCell>
                      <TableCell>{row.utenteNome}</TableCell>
                      <TableCell>{row.pazienteNome ?? "—"}</TableCell>
                      <TableCell>{AZIONI[row.azione] ?? row.azione}</TableCell>
                      <TableCell>
                        <Badge variant={esito.variant}>{esito.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.provider} · {row.modello}
                      </TableCell>
                      <TableCell className="text-right">{formatBytes(row.byteAudio)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PrivacyPage() {
  const { user, isAdmin } = useUser();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-privacy-title">
            Privacy & Sicurezza
          </h1>
          <p className="text-muted-foreground mt-1">
            Informativa AI ai pazienti e registro di utilizzo dell'AI
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 flex gap-3 text-sm">
          <Shield className="w-5 h-5 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            La dettatura vocale con AI funziona solo per i pazienti che hanno ricevuto l'informativa e hanno acconsentito
            (L. 132/2025, art. 7). La scelta si registra nella scheda di ogni paziente. Il testo dell'informativa è una bozza:
            va validato dal DPO o da un legale prima dell'uso con pazienti reali.
          </p>
        </CardContent>
      </Card>

      {user && (isAdmin ? (
        <AuditAi />
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Il registro di utilizzo dell'AI è visibile solo agli amministratori dell'ambulatorio.
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
