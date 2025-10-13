import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanKey } from "@shared/features";
import { type Subscription } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Check, CreditCard, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

// Hardcoded ambulatorio ID (no auth system)
const AMBULATORIO_ID = "4fc2e9ce-3c28-4782-8a13-74f128cebee5";

const STRIPE_PRICE_IDS = {
  BASE: import.meta.env.VITE_STRIPE_PRICE_BASE || "price_base",
  PROFESSIONAL: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || "price_professional",
  ENTERPRISE: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || "price_enterprise",
};

const PLAN_DETAILS = {
  BASE: {
    name: "BASE",
    price: 189,
    period: "al mese",
    description: "Funzionalità essenziali per iniziare",
    features: PLANS.BASE.features,
    priceId: STRIPE_PRICE_IDS.BASE,
  },
  PROFESSIONAL: {
    name: "PROFESSIONAL",
    price: 249,
    period: "al mese",
    description: "AI e funzionalità avanzate",
    features: PLANS.PROFESSIONAL.features,
    priceId: STRIPE_PRICE_IDS.PROFESSIONAL,
  },
  ENTERPRISE: {
    name: "ENTERPRISE",
    price: 599,
    period: "al mese",
    description: "Tutto illimitato con supporto dedicato",
    features: PLANS.ENTERPRISE.features,
    priceId: STRIPE_PRICE_IDS.ENTERPRISE,
  },
};

export default function BillingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription", AMBULATORIO_ID],
    queryFn: async () => {
      const res = await fetch(`/api/subscription?ambulatorioId=${AMBULATORIO_ID}`);
      if (!res.ok) throw new Error("Errore caricamento subscription");
      return res.json();
    }
  });

  // Check for success payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const sessionId = urlParams.get("session_id");

    if (success === "true" && sessionId) {
      toast({
        title: "Pagamento completato",
        description: "Il tuo abbonamento è stato attivato con successo",
      });
      
      // Refresh subscription data
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/impostazioni/billing");
    }
  }, [toast]);

  const checkoutMutation = useMutation({
    mutationFn: async ({ piano, priceId }: { piano: string; priceId: string }) => {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        ambulatorioId: AMBULATORIO_ID,
        piano,
        priceId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile iniziare il checkout",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/create-portal-session", {
        ambulatorioId: AMBULATORIO_ID,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aprire il portale di gestione",
        variant: "destructive",
      });
    }
  });

  const handleUpgrade = async (planName: string, priceId: string) => {
    setLoadingPlan(planName);
    checkoutMutation.mutate({ piano: planName, priceId });
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = subscription?.piano as PlanKey;
  const isTrial = subscription?.status === "TRIAL";
  const hasStripeSubscription = !!subscription?.stripeSubscriptionId;

  const getPlanButton = (planKey: keyof typeof PLAN_DETAILS) => {
    const plan = PLAN_DETAILS[planKey];
    const isCurrentPlan = currentPlan === planKey;

    if (isCurrentPlan) {
      return (
        <Button variant="outline" disabled data-testid={`button-current-${planKey.toLowerCase()}`}>
          Piano Attuale
        </Button>
      );
    }

    // Tutti i piani ora hanno un prezzo e possono essere cambiati
    if (hasStripeSubscription) {
      // Se ha già un abbonamento Stripe, usa il portale per cambiare
      return (
        <Button
          variant={planKey === "PROFESSIONAL" ? "default" : "outline"}
          onClick={() => portalMutation.mutate()}
          disabled={portalMutation.isPending}
          data-testid={`button-change-${planKey.toLowerCase()}`}
        >
          {portalMutation.isPending ? "Caricamento..." : "Gestisci su Stripe"}
        </Button>
      );
    }

    if (!plan.priceId) return null;

    return (
      <Button
        variant={planKey === "PROFESSIONAL" ? "default" : "outline"}
        onClick={() => handleUpgrade(plan.name, plan.priceId!)}
        disabled={loadingPlan === plan.name}
        data-testid={`button-upgrade-${planKey.toLowerCase()}`}
      >
        {loadingPlan === plan.name ? "Caricamento..." : "Passa a " + plan.name}
      </Button>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" data-testid="page-billing">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Abbonamento e Fatturazione</h1>
            <p className="text-muted-foreground mt-1">
              Piano attuale: <strong>{currentPlan}</strong>
              {isTrial && subscription?.dataFine && (
                <span className="ml-2 text-warning">
                  (Trial fino al {format(new Date(subscription.dataFine), "dd MMMM yyyy", { locale: it })})
                </span>
              )}
            </p>
          </div>

          {hasStripeSubscription && (
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              data-testid="button-manage-billing"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {portalMutation.isPending ? "Caricamento..." : "Gestisci Fatturazione"}
            </Button>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((key) => {
            const plan = PLAN_DETAILS[key];
            const isCurrentPlan = currentPlan === key;

            return (
              <Card
                key={key}
                className={`relative ${
                  key === "PROFESSIONAL" ? "border-primary shadow-lg" : ""
                } ${isCurrentPlan ? "bg-accent/30" : ""}`}
                data-testid={`card-plan-${key.toLowerCase()}`}
              >
                {key === "PROFESSIONAL" && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Più Popolare
                    </span>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl" data-testid={`text-plan-name-${key.toLowerCase()}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold" data-testid={`text-price-${key.toLowerCase()}`}>
                      {plan.price === 0 ? "Gratis" : `€${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {getPlanButton(key)}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Info gestione abbonamento */}
        {hasStripeSubscription && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Puoi gestire il tuo abbonamento, aggiornare i metodi di pagamento e visualizzare le fatture tramite il portale Stripe cliccando su "Gestisci Fatturazione"
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
