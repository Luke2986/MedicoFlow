import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Download, ShieldCheck, ShieldOff, ShieldAlert } from 'lucide-react';
import type { ConsensoAi } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ConsensoResponse {
  consenso: ConsensoAi | null;
  versioneCorrente: string;
}

export function InformativaAiCard({ pazienteId }: { pazienteId: string }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scelta, setScelta] = useState<'si' | 'no'>('si');
  const queryKey = ['/api/pazienti', pazienteId, 'consenso-ai'];

  const { data, isLoading } = useQuery<ConsensoResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/pazienti/${pazienteId}/consenso-ai`);
      if (!res.ok) throw new Error('Errore nel caricamento del consenso AI');
      return res.json();
    },
  });

  const onError = (error: Error) =>
    toast({ title: 'Operazione non riuscita', description: error.message, variant: 'destructive' });

  const registra = useMutation({
    mutationFn: (consensoRegistrazione: boolean) =>
      apiRequest('POST', `/api/pazienti/${pazienteId}/consenso-ai`, { consensoRegistrazione }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setDialogOpen(false);
      toast({ title: 'Informativa AI registrata' });
    },
    onError,
  });

  const revoca = useMutation({
    mutationFn: () => apiRequest('POST', `/api/pazienti/${pazienteId}/consenso-ai/revoca`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Consenso AI revocato' });
    },
    onError,
  });

  const consenso = data?.consenso;
  const versioneSuperata = consenso && data && consenso.versioneInformativa !== data.versioneCorrente;

  let stato: JSX.Element;
  if (isLoading) {
    stato = <Badge variant="outline">Caricamento…</Badge>;
  } else if (!consenso) {
    stato = (
      <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
        <ShieldAlert className="h-3 w-3 mr-1" /> Non registrata
      </Badge>
    );
  } else if (consenso.consensoRegistrazione) {
    stato = (
      <Badge className="bg-emerald-600 hover:bg-emerald-600">
        <ShieldCheck className="h-3 w-3 mr-1" /> Consenso dato
      </Badge>
    );
  } else {
    stato = (
      <Badge variant="destructive">
        <ShieldOff className="h-3 w-3 mr-1" /> Rifiutata
      </Badge>
    );
  }

  return (
    <Card data-testid="card-informativa-ai">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 flex-wrap">
          Informativa AI {stato}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {consenso ? (
          <p className="text-muted-foreground">
            Registrata il {format(new Date(consenso.createdAt), 'd MMMM yyyy', { locale: it })} · versione{' '}
            {consenso.versioneInformativa}
            {versioneSuperata && (
              <span className="block text-orange-700 dark:text-orange-300">
                Il testo dell'informativa è cambiato (versione attuale {data?.versioneCorrente}): fai firmare la nuova versione.
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            Senza informativa registrata la dettatura vocale con AI è bloccata per questo paziente.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/pazienti/${pazienteId}/informativa-ai-pdf`, '_blank')}
            data-testid="button-informativa-ai-pdf"
          >
            <Download className="h-4 w-4 mr-2" />
            Stampa informativa
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-registra-informativa-ai">
            Registra scelta del paziente
          </Button>
          {consenso && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => revoca.mutate()}
              disabled={revoca.isPending}
              data-testid="button-revoca-informativa-ai"
            >
              Revoca
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra la scelta del paziente</DialogTitle>
            <DialogDescription>
              Consegna o leggi al paziente l'informativa (versione {data?.versioneCorrente}) e registra la sua scelta.
              Conserva la copia firmata.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup value={scelta} onValueChange={(v) => setScelta(v as 'si' | 'no')} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="si" id="consenso-si" />
              <Label htmlFor="consenso-si">Acconsente alla trascrizione con AI</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id="consenso-no" />
              <Label htmlFor="consenso-no">Non acconsente</Label>
            </div>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => registra.mutate(scelta === 'si')} disabled={registra.isPending} data-testid="button-conferma-informativa-ai">
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
