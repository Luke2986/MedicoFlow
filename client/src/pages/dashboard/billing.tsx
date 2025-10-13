import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { PricingCard } from "@/components/PricingCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanKey } from "@shared/features";
import { type Subscription } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ExternalLink, CheckCircle2, CreditCard } from "lucide-react";
import { useEffect } from "react";

// Hardcoded ambulatorio ID (no auth system)
const AMBULATORIO_ID = "4fc2e9ce-3c28-4782-8a13-74f128cebee5";

export default function BillingPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" data-testid="page-billing">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con info piano corrente */}
        <Card data-testid="card-current-subscription">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Piano di Abbonamento</CardTitle>
              <CardDescription className="mt-2">
                Piano attuale: <strong>{currentPlan}</strong>
                {isTrial && subscription?.dataFine && (
                  <span className="ml-2 text-warning">
                    (Trial fino al {format(new Date(subscription.dataFine), "dd MMMM yyyy", { locale: it })})
                  </span>
                )}
              </CardDescription>
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
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {hasStripeSubscription 
                ? "Gestisci il tuo abbonamento, aggiorna i metodi di pagamento e visualizza le fatture."
                : "Scegli un piano premium per sbloccare funzionalità avanzate per il tuo ambulatorio."
              }
            </div>
          </CardContent>
        </Card>

        {/* Call to action se piano BASE */}
        {currentPlan === "BASE" && (
          <Alert data-testid="alert-upgrade-cta">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>
                Passa a un piano premium per accedere a ricerca AI, trascrizione vocale e funzionalità avanzate
              </span>
              <Button
                variant="default"
                onClick={() => setLocation("/pricing")}
                data-testid="button-view-plans"
              >
                Vedi Piani
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Info piano corrente con features */}
        <Card>
          <CardHeader>
            <CardTitle>Funzionalità Incluse nel Piano {currentPlan}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-3">
              {PLANS[currentPlan].features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
