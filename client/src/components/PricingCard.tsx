import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { type PlanKey } from "@shared/features";

interface PricingCardProps {
  piano: PlanKey;
  prezzo: number;
  features: string[];
  isCurrentPlan?: boolean;
  isTrial?: boolean;
  onUpgrade?: () => void;
  onDowngrade?: () => void;
  disabled?: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  "basic-features": "Funzionalità Base",
  "fuzzy-search": "AI Agent Search",
  "advanced-analytics": "Analytics Avanzate",
  "multi-ambulatorio": "Multi-ambulatorio",
  "priority-support": "Supporto Prioritario",
  "custom-integrations": "Integrazioni Custom",
};

export function PricingCard({
  piano,
  prezzo,
  features,
  isCurrentPlan = false,
  isTrial = false,
  onUpgrade,
  onDowngrade,
  disabled = false,
}: PricingCardProps) {
  const isRecommended = piano === "PROFESSIONAL";

  return (
    <Card 
      className={`relative ${isRecommended ? "border-primary" : ""}`}
      data-testid={`card-pricing-${piano.toLowerCase()}`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground gap-1" data-testid="badge-recommended">
            <Sparkles className="w-3 h-3" />
            Consigliato
          </Badge>
        </div>
      )}

      <CardHeader className="gap-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle data-testid={`text-plan-${piano.toLowerCase()}`}>{piano}</CardTitle>
          {isCurrentPlan && (
            <Badge variant="outline" data-testid="badge-current-plan">
              {isTrial ? "Trial Attivo" : "Piano Attuale"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-2xl font-bold" data-testid={`text-price-${piano.toLowerCase()}`}>
          €{(prezzo / 100).toFixed(0)}
          <span className="text-sm font-normal text-muted-foreground">/mese</span>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ul className="space-y-2" data-testid={`list-features-${piano.toLowerCase()}`}>
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{FEATURE_LABELS[feature] || feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button 
            variant="outline" 
            className="w-full" 
            disabled 
            data-testid={`button-current-${piano.toLowerCase()}`}
          >
            Piano Attuale
          </Button>
        ) : onUpgrade ? (
          <Button 
            variant={isRecommended ? "default" : "outline"}
            className="w-full" 
            onClick={onUpgrade}
            disabled={disabled}
            data-testid={`button-upgrade-${piano.toLowerCase()}`}
          >
            Passa a {piano}
          </Button>
        ) : onDowngrade ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onDowngrade}
            disabled={disabled}
            data-testid={`button-downgrade-${piano.toLowerCase()}`}
          >
            Passa a {piano}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
