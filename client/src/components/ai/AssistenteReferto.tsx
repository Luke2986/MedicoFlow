import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertTriangle, Check, Copy, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDemo } from "@/lib/demo";
import { VoiceRecorder } from "./VoiceRecorder";
import { DETTATURE_ESEMPIO } from "@shared/dettature-esempio";
import {
  CAMPI_NUMERICI,
  CAMPI_TESTO,
  ETICHETTE_CAMPI,
  type CampoReferto,
  type MotoreReferto,
  type PropostaReferto,
} from "@shared/referto";

const ORDINE_CAMPI: CampoReferto[] = [...CAMPI_TESTO, ...CAMPI_NUMERICI];

const FASI_ANALISI = [
  "Lettura della dettatura",
  "Riconoscimento delle sezioni cliniche",
  "Estrazione dei parametri vitali",
  "Preparazione della proposta",
];

const BADGE_MOTORE: Record<MotoreReferto, string> = {
  llm: "AI · llama-3.3",
  simulato: "MedicoFlow AI · simulazione demo",
  regole: "Regole locali · senza AI",
};

function erroreDa(error: Error): { messaggio: string; consensoMancante: boolean } {
  const raw = error.message.replace(/^\d+: /, "");
  try {
    const body = JSON.parse(raw);
    return { messaggio: body.error ?? raw, consensoMancante: body.code === "CONSENSO_AI_MANCANTE" };
  } catch {
    return { messaggio: raw, consensoMancante: false };
  }
}

function campoForm(form: HTMLFormElement | null, nome: CampoReferto) {
  const el = form?.elements.namedItem(nome);
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? el : null;
}

interface AssistenteRefertoProps {
  ambulatorioId: string;
  userId: string;
  pazienteId?: string;
  disabled?: boolean;
  formRef: RefObject<HTMLFormElement | null>;
  /** Called after AI-proposed values are written into the form: the parent must then require the review confirmation. */
  onApplicato: (motore: MotoreReferto) => void;
}

export function AssistenteReferto({ ambulatorioId, userId, pazienteId, disabled, formRef, onApplicato }: AssistenteRefertoProps) {
  const { toast } = useToast();
  const { data: demo } = useDemo();
  const { data: statoAi } = useQuery<{ trascrizione: boolean; strutturazione: MotoreReferto; simulazione: boolean }>({
    queryKey: ["/api/ai/stato"],
  });
  const idTesto = useId();
  const [testo, setTesto] = useState("");
  const [aperto, setAperto] = useState(false);
  const [esempio, setEsempio] = useState(false);
  const [proposta, setProposta] = useState<PropostaReferto | null>(null);
  const [selezionati, setSelezionati] = useState<Set<CampoReferto>>(new Set());
  const [scrivendo, setScrivendo] = useState(false);
  const [fase, setFase] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => () => clearInterval(timerRef.current), []);

  // A transcription appears word by word, as it does with streaming providers.
  const scriviAnimato = (finale: string) => {
    clearInterval(timerRef.current);
    const parole = finale.split(" ");
    let n = 0;
    setScrivendo(true);
    timerRef.current = setInterval(() => {
      n = Math.min(parole.length, n + 2);
      setTesto(parole.slice(0, n).join(" "));
      if (n >= parole.length) {
        clearInterval(timerRef.current);
        setScrivendo(false);
      }
    }, 35);
  };

  const struttura = useMutation({
    mutationFn: async () => {
      setFase(0);
      const t = setInterval(() => setFase((f) => Math.min(FASI_ANALISI.length - 1, f + 1)), 450);
      try {
        const res = await apiRequest("POST", "/api/ai/referto", { pazienteId, testo });
        return (await res.json()) as PropostaReferto;
      } finally {
        clearInterval(t);
      }
    },
    onSuccess: (p) => {
      setProposta(p);
      // Pre-select only fields the doctor has not filled in yet, so nothing is overwritten by default.
      const liberi = ORDINE_CAMPI.filter((c) => {
        const v = p.campi[c];
        return v !== null && v !== "" && !campoForm(formRef.current, c)?.value;
      });
      setSelezionati(new Set(liberi));
    },
  });
  const errore = struttura.error ? erroreDa(struttura.error as Error) : null;

  const usaTesto = (nuovo: string, daEsempio: boolean, animato = false) => {
    if (animato) scriviAnimato(nuovo);
    else setTesto(nuovo);
    setEsempio(daEsempio);
    setAperto(true);
    setProposta(null);
    struttura.reset();
  };

  const applica = () => {
    if (!proposta) return;
    const applicati: string[] = [];
    for (const c of Array.from(selezionati)) {
      const el = campoForm(formRef.current, c);
      const v = proposta.campi[c];
      if (!el || v === null || v === "") continue;
      el.value = String(v);
      el.dataset.aiProposta = "true";
      el.addEventListener("input", () => delete el.dataset.aiProposta, { once: true });
      applicati.push(ETICHETTE_CAMPI[c]);
    }
    if (applicati.length === 0) return;
    onApplicato(proposta.motore);
    setProposta(null);
    toast({ title: "Campi compilati", description: `Verifica i campi evidenziati: ${applicati.join(", ")}` });
  };

  const campiProposti = proposta ? ORDINE_CAMPI.filter((c) => proposta.campi[c] !== null && proposta.campi[c] !== "") : [];

  return (
    <div className="space-y-3">
      <VoiceRecorder
        ambulatorioId={ambulatorioId}
        userId={userId}
        pazienteId={pazienteId}
        onTranscriptionComplete={(result) => usaTesto(result?.correctedText || result?.text || "", false, true)}
        disabled={disabled || !statoAi || !statoAi.trascrizione}
        simulazione={statoAi?.simulazione}
      />

      {statoAi?.trascrizione === false && (
        <p className="text-sm text-muted-foreground" data-testid="text-trascrizione-non-configurata">
          Dettatura vocale non configurata su questo server: puoi scrivere o incollare il testo della dettatura
          {demo?.demo ? " oppure usare una dettatura di esempio." : "."}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {demo?.demo &&
          !statoAi?.simulazione &&
          DETTATURE_ESEMPIO.map((d) => (
            <Button key={d.id} type="button" variant="secondary" size="sm" onClick={() => usaTesto(d.testo, true)} data-testid={`button-esempio-${d.id}`}>
              <Wand2 className="h-3.5 w-3.5 mr-1.5" /> Esempio: {d.titolo}
            </Button>
          ))}
        {!aperto && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setAperto(true)} data-testid="button-scrivi-dettatura">
            Scrivi o incolla il testo
          </Button>
        )}
      </div>

      {aperto && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor={idTesto} className="text-blue-900 dark:text-blue-100 font-semibold">
                  Dettatura
                </Label>
              </div>
              <Badge variant="outline" className="text-xs">
                {scrivendo ? "Trascrizione…" : esempio ? "Esempio: nessun audio registrato" : "Verificabile/Editabile"}
              </Badge>
            </div>
            <Textarea
              id={idTesto}
              value={testo}
              readOnly={scrivendo}
              onChange={(e) => {
                setTesto(e.target.value);
                setProposta(null);
              }}
              className="min-h-[120px] bg-white dark:bg-gray-950 font-mono text-sm"
              placeholder="Anamnesi: … Esame obiettivo: … Diagnosi: … Terapia: …"
              data-testid="textarea-transcription"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => struttura.mutate()}
                disabled={!testo.trim() || !pazienteId || struttura.isPending || scrivendo || disabled}
                data-testid="button-struttura-referto"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {struttura.isPending ? "Analisi in corso…" : "Struttura referto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!testo.trim()}
                onClick={() => {
                  const note = campoForm(formRef.current, "noteCliniche");
                  if (note) note.value = testo;
                  toast({ title: "Testo copiato", description: "La dettatura è stata copiata nelle note cliniche" });
                }}
                data-testid="button-copy-transcription"
              >
                <Copy className="h-4 w-4 mr-2" /> Copia nelle note cliniche
              </Button>
            </div>
            {statoAi?.strutturazione === "regole" && (
              <p className="text-xs text-muted-foreground">
                Senza fornitore AI configurato la strutturazione usa regole locali: riconosce le sezioni dette ad alta voce
                ("Anamnesi:", "Esame obiettivo:", "Diagnosi:", "Terapia:"…) e i parametri vitali.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {struttura.isPending && (
        <Card data-testid="card-analisi-referto">
          <CardContent className="pt-4 space-y-2">
            {FASI_ANALISI.map((f, i) => (
              <div key={f} className={`flex items-center gap-2 text-sm ${i > fase ? "text-muted-foreground/50" : ""}`}>
                {i < fase ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : i === fase ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="h-4 w-4" />
                )}
                {f}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {errore && (
        <Alert variant="destructive" data-testid="alert-errore-referto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errore.messaggio}
            {errore.consensoMancante && pazienteId && (
              <>
                {" "}
                <Link href={`/dashboard/pazienti/${pazienteId}`} className="underline font-medium">
                  Registra l'informativa nella scheda paziente
                </Link>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {proposta && (
        <Card className="border-amber-300 dark:border-amber-800" data-testid="card-proposta-referto">
          <CardContent className="pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">Proposta di compilazione</p>
              <Badge variant="secondary" data-testid="badge-motore-referto">
                {BADGE_MOTORE[proposta.motore]}
              </Badge>
            </div>
            {campiProposti.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna sezione riconosciuta nel testo dettato.</p>
            ) : (
              <ul className="space-y-2">
                {campiProposti.map((c, i) => {
                  const attuale = campoForm(formRef.current, c)?.value;
                  return (
                    <li
                      key={c}
                      className="flex gap-3 rounded-md border p-2 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300"
                      style={{ animationDelay: `${i * 90}ms` }}
                    >
                      <Checkbox
                        id={`proposta-${c}`}
                        checked={selezionati.has(c)}
                        onCheckedChange={(v) => {
                          const next = new Set(selezionati);
                          if (v) next.add(c);
                          else next.delete(c);
                          setSelezionati(next);
                        }}
                        data-testid={`checkbox-proposta-${c}`}
                      />
                      <label htmlFor={`proposta-${c}`} className="text-sm space-y-1 cursor-pointer">
                        <span className="font-medium block">{ETICHETTE_CAMPI[c]}</span>
                        <span className="block whitespace-pre-wrap">{String(proposta.campi[c])}</span>
                        {attuale && (
                          <span className="block text-xs text-muted-foreground">Già compilato: {attuale}. Se selezioni il campo viene sostituito.</span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <Button type="button" size="sm" onClick={applica} disabled={selezionati.size === 0} data-testid="button-applica-proposta">
              Applica i campi selezionati
            </Button>
          </CardContent>
        </Card>
      )}

      {(aperto || proposta) && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Verifica obbligatoria:</strong> trascrizione e proposta possono contenere errori. I campi compilati restano
            evidenziati finché non li modifichi, e prima di salvare dovrai confermare di averli riletti.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
