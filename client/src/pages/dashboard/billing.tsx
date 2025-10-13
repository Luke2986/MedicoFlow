import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PLANS, type PlanKey } from "@shared/features";
import { type Subscription } from "@shared/schema";
import { Check, Sparkles, X, CheckCircle2 } from "lucide-react";

const AMBULATORIO_ID = "4fc2e9ce-3c28-4782-8a13-74f128cebee5";

const PLAN_DETAILS = {
  BASE: {
    name: "BASE",
    price: 189,
    period: "al mese",
    description: "Funzionalità essenziali per iniziare",
    features: PLANS.BASE.features,
  },
  PROFESSIONAL: {
    name: "PROFESSIONAL",
    price: 249,
    period: "al mese",
    description: "AI e funzionalità avanzate",
    features: PLANS.PROFESSIONAL.features,
    popular: true,
  },
  ENTERPRISE: {
    name: "ENTERPRISE",
    price: 599,
    period: "al mese",
    description: "Tutto illimitato con supporto dedicato",
    features: PLANS.ENTERPRISE.features,
  },
};

export default function BillingPage() {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLAN_DETAILS | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    ambulatorio: "",
    telefono: "",
    note: "",
  });

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ["/api/subscription", AMBULATORIO_ID],
  });

  const handlePlanSelect = (planKey: keyof typeof PLAN_DETAILS) => {
    setSelectedPlan(planKey);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/pricing-leads", {
        ...formData,
        piano: selectedPlan,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setShowModal(false);
          setSuccess(false);
          setFormData({ nome: "", email: "", ambulatorio: "", telefono: "", note: "" });
          setSelectedPlan(null);
        }, 3000);
      } else {
        throw new Error("Errore invio");
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare la richiesta. Riprova.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-1/2" />
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

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" data-testid="page-billing">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold">Abbonamento e Prezzi</h1>
          <p className="text-muted-foreground mt-1">
            Piano attuale: <strong>{currentPlan}</strong>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((key) => {
            const plan = PLAN_DETAILS[key];
            const isCurrentPlan = currentPlan === key;

            return (
              <Card
                key={key}
                className={`relative ${
                  plan.popular ? "border-primary shadow-lg" : ""
                } ${isCurrentPlan ? "bg-accent/30" : ""}`}
                data-testid={`card-plan-${key.toLowerCase()}`}
              >
                {plan.popular && (
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
                      €{plan.price}
                    </span>
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
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
                  {isCurrentPlan ? (
                    <Button variant="outline" disabled data-testid={`button-current-${key.toLowerCase()}`} className="w-full">
                      Piano Attuale
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handlePlanSelect(key)}
                      data-testid={`button-request-${key.toLowerCase()}`}
                      className="w-full"
                    >
                      Richiedi Demo Gratuita
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            ✅ Conforme GDPR • 🏥 FSE 2.0 Ready • 🔒 Server italiani
          </p>
          <p className="text-xs text-muted-foreground">
            💳 Nessuna carta di credito richiesta • 14 giorni di prova gratuita
          </p>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <button
            onClick={() => setShowModal(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Chiudi</span>
          </button>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl">Richiesta Inviata! 🎉</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Ti contatteremo entro 24 ore per organizzare la demo personalizzata del piano {selectedPlan}.
                </DialogDescription>
              </DialogHeader>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  Demo Gratuita Piano {selectedPlan && PLAN_DETAILS[selectedPlan].name}
                </DialogTitle>
                <DialogDescription>
                  Compila il form e ti mostreremo come MedicoFlow può trasformare il tuo ambulatorio.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Dr. Mario Rossi"
                    data-testid="input-nome"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="mario.rossi@email.it"
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="ambulatorio">Nome ambulatorio</Label>
                  <Input
                    id="ambulatorio"
                    value={formData.ambulatorio}
                    onChange={(e) => setFormData(prev => ({ ...prev, ambulatorio: e.target.value }))}
                    placeholder="Studio Medico Associato"
                    data-testid="input-ambulatorio"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+39 333 1234567"
                    data-testid="input-telefono"
                  />
                </div>

                <div>
                  <Label htmlFor="note">Note (opzionale)</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    placeholder="Esigenze particolari o domande..."
                    data-testid="textarea-note"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full"
                  data-testid="button-submit-lead"
                >
                  {loading ? "Invio in corso..." : "Richiedi Demo Gratuita"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Compilando questo form accetti di essere contattato dal nostro team commerciale.
                </p>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
