import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Crown } from "lucide-react";
import { Link } from "wouter";

interface UpgradePromptProps {
  featureName: string;
  requiredPlan: string;
  description?: string;
}

export function UpgradePrompt({ 
  featureName, 
  requiredPlan, 
  description 
}: UpgradePromptProps) {
  return (
    <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent" data-testid="card-upgrade-prompt">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg" data-testid="text-upgrade-title">
            Feature Premium: {featureName}
          </CardTitle>
        </div>
        <CardDescription data-testid="text-upgrade-description">
          {description || `Questa funzionalità è disponibile solo con il piano ${requiredPlan}`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>Sblocca funzionalità avanzate per il tuo ambulatorio</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch sm:flex-row gap-2">
        <Button 
          asChild 
          variant="default" 
          className="flex-1"
          data-testid="button-upgrade-now"
        >
          <Link href="/dashboard/impostazioni/billing">
            Passa a {requiredPlan}
          </Link>
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          data-testid="button-learn-more"
        >
          Scopri di più
        </Button>
      </CardFooter>
    </Card>
  );
}
