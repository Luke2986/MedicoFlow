import { Card } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function Impostazioni() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-impostazioni-title">
          Impostazioni
        </h1>
        <p className="text-muted-foreground">
          Configura il tuo ambulatorio e le preferenze dell'applicazione
        </p>
      </div>

      <Card className="p-6">
        <div className="text-center py-16">
          <Settings className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funzionalità in arrivo
          </h3>
          <p className="text-muted-foreground">
            Le impostazioni saranno disponibili a breve
          </p>
        </div>
      </Card>
    </div>
  );
}
