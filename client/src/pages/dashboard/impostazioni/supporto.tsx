import { Link } from "wouter";
import { ArrowLeft, HelpCircle, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SupportoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-supporto-title">
            Supporto & Documentazione
          </h1>
          <p className="text-muted-foreground mt-1">
            Guide, FAQ e assistenza
          </p>
        </div>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Funzionalità in arrivo
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Presto troverai qui guide complete, FAQ e sistema di assistenza dedicato.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" className="hover-elevate" asChild>
              <a href="mailto:supporto@medicoflow.it" data-testid="link-email-supporto">
                Contatta Supporto
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
