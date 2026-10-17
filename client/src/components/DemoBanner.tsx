import { useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { enterDemo, resetDemo, useDemo } from "@/lib/demo";

type Azione = {
  label: string;
  title: string;
  description: string;
  run: () => Promise<string>;
  testId: string;
  variant: "outline" | "ghost";
};

export function DemoBanner() {
  const demo = useDemo();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!demo.data?.demo) return null;

  const azioni: Azione[] = [
    {
      label: "Ripristina dati demo",
      title: "Ripristinare i dati di esempio?",
      description: "Tutte le modifiche fatte nella demo verranno cancellate e torneranno i pazienti, gli appuntamenti e le visite di esempio.",
      run: async () => {
        await resetDemo("demo");
        await enterDemo();
        return "/dashboard";
      },
      testId: "button-demo-restore",
      variant: "outline",
    },
    {
      label: "Ricomincia da zero",
      title: "Ricominciare da zero?",
      description: "Tutti i dati verranno cancellati. Potrai creare il tuo ambulatorio e provare l'app partendo vuoto.",
      run: async () => {
        await resetDemo("empty");
        return "/setup";
      },
      testId: "button-demo-empty",
      variant: "ghost",
    },
  ];

  const esegui = async (azione: Azione) => {
    setBusy(true);
    try {
      // Full reload: every screen must drop the data of the clinic that no longer exists.
      window.location.assign(await azione.run());
    } catch (error) {
      toast({ title: "Operazione non riuscita", description: (error as Error).message, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-6 py-2 border-b border-border bg-primary/5 text-sm" data-testid="banner-demo">
      <div className="flex items-start gap-2 flex-1 text-muted-foreground">
        <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <span>
          Stai usando la <strong className="text-foreground">demo</strong>: dati inventati, condivisi con gli altri visitatori e azzerati quando il server si riavvia.
        </span>
      </div>
      <div className="flex gap-2">
        {azioni.map((azione) => (
          <AlertDialog key={azione.testId}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant={azione.variant} disabled={busy} data-testid={azione.testId}>
                {busy && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {azione.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{azione.title}</AlertDialogTitle>
                <AlertDialogDescription>{azione.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={() => esegui(azione)}>Conferma</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>
    </div>
  );
}
