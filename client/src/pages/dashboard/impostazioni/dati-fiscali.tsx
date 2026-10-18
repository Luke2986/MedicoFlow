import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/useUser";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NATURE_IVA, REGIMI_FISCALI } from "@shared/fiscale";

interface Member {
  id: string;
  nome: string;
  cognome: string;
  ruolo: "admin" | "medico" | "segreteria";
}

interface DatiFiscali {
  codiceFiscale: string | null;
  partitaIva: string | null;
  regimeFiscale: string | null;
  naturaIvaDefault: string | null;
}

const NESSUN_REGIME = "nessuno";

export default function DatiFiscaliPage() {
  const { user, isAdmin } = useUser();
  const { toast } = useToast();
  const { data: members = [] } = useQuery<Member[]>({ queryKey: ["/api/team"], enabled: isAdmin });
  const medici = members.filter((m) => m.ruolo !== "segreteria");
  const [medicoId, setMedicoId] = useState("");
  const targetId = medicoId || user?.id || "";

  const { data, isLoading } = useQuery<DatiFiscali>({
    queryKey: ["/api/team", targetId, "fiscale"],
    queryFn: async () => {
      const res = await fetch(`/api/team/${targetId}/fiscale`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
    enabled: !!targetId && user?.ruolo !== "segreteria",
  });

  const [form, setForm] = useState({ codiceFiscale: "", partitaIva: "", regimeFiscale: NESSUN_REGIME, naturaIvaDefault: "N4" });
  useEffect(() => {
    if (!data) return;
    setForm({
      codiceFiscale: data.codiceFiscale ?? "",
      partitaIva: data.partitaIva ?? "",
      regimeFiscale: data.regimeFiscale ?? NESSUN_REGIME,
      naturaIvaDefault: data.naturaIvaDefault ?? "N4",
    });
  }, [data]);

  const salva = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/team/${targetId}/fiscale`, {
        ...form,
        regimeFiscale: form.regimeFiscale === NESSUN_REGIME ? null : form.regimeFiscale,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team", targetId, "fiscale"] });
      toast({ title: "Dati fiscali salvati" });
    },
    onError: (error: Error) => {
      const message = error.message.replace(/^\d+: /, "");
      let description = message;
      try {
        description = JSON.parse(message).error ?? message;
      } catch {}
      toast({ title: "Salvataggio non riuscito", description, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dati fiscali</h1>
          <p className="text-muted-foreground mt-1">Servono per emettere fatture e inviarle al Sistema Tessera Sanitaria</p>
        </div>
      </div>

      {user?.ruolo === "segreteria" ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            La segreteria non emette documenti fiscali: i dati fiscali si inseriscono per ciascun medico.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Medico emittente</CardTitle>
            <CardDescription>
              Nel Sistema TS il titolare della spesa è il singolo medico, con il proprio codice fiscale e la propria partita IVA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin && medici.length > 0 && (
              <div className="space-y-2">
                <Label>Medico</Label>
                <Select value={targetId} onValueChange={setMedicoId}>
                  <SelectTrigger data-testid="select-medico-fiscale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {medici.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.cognome} {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cf">Codice fiscale</Label>
                <Input
                  id="cf"
                  value={form.codiceFiscale}
                  onChange={(e) => setForm({ ...form, codiceFiscale: e.target.value.toUpperCase() })}
                  maxLength={16}
                  disabled={isLoading}
                  data-testid="input-cf-medico"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="piva">Partita IVA</Label>
                <Input
                  id="piva"
                  value={form.partitaIva}
                  onChange={(e) => setForm({ ...form, partitaIva: e.target.value.replace(/\D/g, "") })}
                  maxLength={11}
                  inputMode="numeric"
                  disabled={isLoading}
                  data-testid="input-piva-medico"
                />
              </div>
              <div className="space-y-2">
                <Label>Regime fiscale</Label>
                <Select value={form.regimeFiscale} onValueChange={(v) => setForm({ ...form, regimeFiscale: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NESSUN_REGIME}>Non indicato</SelectItem>
                    {Object.entries(REGIMI_FISCALI).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Natura IVA predefinita</Label>
                <Select value={form.naturaIvaDefault} onValueChange={(v) => setForm({ ...form, naturaIvaDefault: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NATURE_IVA).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Natura IVA, regime e dicitura in fattura vanno confermati con il commercialista. Le prestazioni sanitarie sono di
                norma esenti (N4, art. 10 DPR 633/72); per il regime forfettario si usa di solito N2.2.
              </AlertDescription>
            </Alert>

            <Button onClick={() => salva.mutate()} disabled={salva.isPending || !targetId} data-testid="button-salva-fiscale">
              Salva
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
