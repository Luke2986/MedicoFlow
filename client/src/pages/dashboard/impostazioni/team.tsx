import { Link } from "wouter";
import { ArrowLeft, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-team-title">
            Gestione Team
          </h1>
          <p className="text-muted-foreground mt-1">
            Aggiungi collaboratori e gestisci permessi
          </p>
        </div>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funzionalità in arrivo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Presto potrai aggiungere medici collaboratori, gestire ruoli e permessi per il tuo team.
          </p>
        </div>
      </Card>
    </div>
  );
}
