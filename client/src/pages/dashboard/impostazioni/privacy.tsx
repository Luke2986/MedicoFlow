import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
            GDPR, consensi, backup dati e log accessi
          </p>
        </div>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funzionalità in arrivo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Presto avrai accesso a strumenti per gestire consensi GDPR, backup automatici e log di sicurezza.
          </p>
        </div>
      </Card>
    </div>
  );
}
