import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PricingCard } from "@/components/PricingCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanKey } from "@shared/features";
import { type Subscription } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// Hardcoded ambulatorio ID (no auth system)
const AMBULATORIO_ID = "9f6d275b-f296-495b-b80c-907404f09a15";

export default function BillingPage() {
  const { toast } = useToast();

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription", AMBULATORIO_ID],
    queryFn: async () => {
      const res = await fetch(`/api/subscription?ambulatorioId=${AMBULATORIO_ID}`);
      if (!res.ok) throw new Error("Errore caricamento subscription");
      return res.json();
    }
  });

  const upgradeMutation = useMutation({
    mutationFn: async (newPlan: PlanKey) => {
      return await apiRequest("PUT", `/api/subscription`, {
        ambulatorioId: AMBULATORIO_ID,
        piano: newPlan,
        status: "ACTIVE",
        prezzoMensile: PLANS[newPlan].price * 100,
        features: PLANS[newPlan].features,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      toast({
        title: "Piano aggiornato",
        description: "Il tuo piano è stato aggiornato con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il piano",
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

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" data-testid="page-billing">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header con info piano corrente */}
        <Card data-testid="card-current-subscription">
          <CardHeader className="gap-2">
            <CardTitle>Piano di Abbonamento</CardTitle>
            <CardDescription>
              Piano attuale: <strong>{currentPlan}</strong>
              {isTrial && subscription?.dataFine && (
                <span className="ml-2 text-warning">
                  (Trial fino al {format(new Date(subscription.dataFine), "dd MMMM yyyy", { locale: it })})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Gestisci il tuo piano di abbonamento e sblocca funzionalità premium per il tuo ambulatorio.
            </div>
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <PricingCard
            piano="BASE"
            prezzo={PLANS.BASE.price * 100}
            features={[...PLANS.BASE.features]}
            isCurrentPlan={currentPlan === "BASE"}
            isTrial={isTrial && currentPlan === "BASE"}
            disabled={upgradeMutation.isPending}
          />

          <PricingCard
            piano="PROFESSIONAL"
            prezzo={PLANS.PROFESSIONAL.price * 100}
            features={[...PLANS.PROFESSIONAL.features]}
            isCurrentPlan={currentPlan === "PROFESSIONAL"}
            isTrial={isTrial && currentPlan === "PROFESSIONAL"}
            onUpgrade={currentPlan === "BASE" ? () => upgradeMutation.mutate("PROFESSIONAL") : undefined}
            onDowngrade={currentPlan === "ENTERPRISE" ? () => upgradeMutation.mutate("PROFESSIONAL") : undefined}
            disabled={upgradeMutation.isPending}
          />

          <PricingCard
            piano="ENTERPRISE"
            prezzo={PLANS.ENTERPRISE.price * 100}
            features={[...PLANS.ENTERPRISE.features]}
            isCurrentPlan={currentPlan === "ENTERPRISE"}
            isTrial={isTrial && currentPlan === "ENTERPRISE"}
            onUpgrade={currentPlan !== "ENTERPRISE" ? () => upgradeMutation.mutate("ENTERPRISE") : undefined}
            disabled={upgradeMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
