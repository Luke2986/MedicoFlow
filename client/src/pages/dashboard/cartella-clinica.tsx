import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function CartellaClinica() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-cartella-title">
          Cartella Clinica
        </h1>
        <p className="text-muted-foreground">
          Gestisci le cartelle cliniche dei pazienti
        </p>
      </div>

      <Card className="p-6">
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funzionalità in arrivo
          </h3>
          <p className="text-muted-foreground">
            La gestione delle cartelle cliniche sarà disponibile a breve
          </p>
        </div>
      </Card>
    </div>
  );
}
