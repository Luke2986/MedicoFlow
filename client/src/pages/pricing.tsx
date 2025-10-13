import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const AMBULATORIO_ID = "4fc2e9ce-3c28-4782-8a13-74f128cebee5";

const STRIPE_PRICE_IDS = {
  PROFESSIONAL: import.meta.env.VITE_STRIPE_PRICE_PROFESSIONAL || "price_professional",
  ENTERPRISE: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || "price_enterprise",
};

const PLANS = [
  {
    name: "BASE",
    price: 0,
    priceId: null,
    period: "Gratis per sempre",
    description: "Per iniziare con le funzionalità essenziali",
    features: [
      "Gestione pazienti illimitati",
      "Calendario appuntamenti base",
      "Cartelle cliniche digitali",
      "Dashboard statistiche",
      "1 utente",
    ],
    disabled: [
      "Ricerca AI intelligente",
      "Trascrizione vocale clinica",
      "Report avanzati",
      "Team multi-utente",
    ],
    cta: "Piano Attuale",
    variant: "outline" as const,
  },
  {
    name: "PROFESSIONAL",
    price: 49,
    priceId: STRIPE_PRICE_IDS.PROFESSIONAL,
    period: "al mese",
    description: "Per professionisti che vogliono efficienza e AI",
    features: [
      "Tutto in BASE, più:",
      "Ricerca AI intelligente pazienti",
      "Trascrizione vocale (150/mese)",
      "Report mensili automatici",
      "Fino a 3 utenti",
      "Supporto prioritario",
    ],
    disabled: [],
    popular: true,
    cta: "Inizia Prova Gratuita",
    variant: "default" as const,
  },
  {
    name: "ENTERPRISE",
    price: 149,
    priceId: STRIPE_PRICE_IDS.ENTERPRISE,
    period: "al mese",
    description: "Per ambulatori e team con necessità avanzate",
    features: [
      "Tutto in PROFESSIONAL, più:",
      "Trascrizione vocale illimitata",
      "Analytics e insights avanzati",
      "Utenti illimitati",
      "API personalizzate",
      "Supporto dedicato 24/7",
    ],
    disabled: [],
    cta: "Contatta il Team",
    variant: "outline" as const,
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, priceId: string | null) => {
    if (planName === "BASE") {
      toast({
        title: "Piano BASE",
        description: "Sei già sul piano gratuito BASE",
      });
      return;
    }

    if (planName === "ENTERPRISE") {
      window.location.href = "mailto:sales@medicoflow.it?subject=Richiesta Piano Enterprise";
      return;
    }

    if (!priceId) {
      toast({
        title: "Errore",
        description: "Price ID non configurato",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(planName);

    try {
      const response = await apiRequest("POST", "/api/stripe/create-checkout-session", {
        ambulatorioId: AMBULATORIO_ID,
        piano: planName,
        priceId: priceId,
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL checkout non ricevuto");
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del checkout",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const canceled = urlParams.get("canceled");

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Scegli il Piano Perfetto per il Tuo Ambulatorio
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Gestione intelligente dei pazienti con AI. Inizia gratis, passa a Professional quando sei pronto.
        </p>
      </div>

      {canceled === "true" && (
        <Alert className="mb-8 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pagamento annullato. Puoi riprovare quando vuoi.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative ${
              plan.popular ? "border-primary shadow-lg" : ""
            }`}
            data-testid={`card-plan-${plan.name.toLowerCase()}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Più Popolare
                </span>
              </div>
            )}

            <CardHeader>
              <CardTitle className="text-2xl" data-testid={`text-plan-name-${plan.name.toLowerCase()}`}>
                {plan.name}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold" data-testid={`text-price-${plan.name.toLowerCase()}`}>
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
                {plan.disabled.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 opacity-50">
                    <Check className="h-5 w-5 shrink-0 mt-0.5" />
                    <span className="text-sm line-through">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                className="w-full"
                variant={plan.variant}
                onClick={() => handleSubscribe(plan.name, plan.priceId)}
                disabled={loadingPlan === plan.name}
                data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
              >
                {loadingPlan === plan.name ? "Caricamento..." : plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Tutti i piani includono aggiornamenti gratuiti e sicurezza GDPR compliant</p>
        <p className="mt-2">
          Domande? Contattaci a{" "}
          <a href="mailto:support@medicoflow.it" className="text-primary hover:underline">
            support@medicoflow.it
          </a>
        </p>
      </div>
    </div>
  );
}
