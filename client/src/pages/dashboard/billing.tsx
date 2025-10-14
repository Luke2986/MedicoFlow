import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PLANS, FEATURE_NAMES, type PlanKey } from "@shared/features";
import { type Subscription } from "@shared/schema";
import { Check, Sparkles, X, CheckCircle2, Users, Database } from "lucide-react";

const AMBULATORIO_ID = "4fc2e9ce-3c28-4782-8a13-74f128cebee5";

const PLAN_DETAILS = {
  BASE: {
    name: "BASE",
    price: 189,
    period: "al mese",
    description: "Funzionalità essenziali per iniziare",
    features: PLANS.BASE.features,
    popular: false,
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
    popular: false,
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
  const [selectedTab, setSelectedTab] = useState<PlanKey>("PROFESSIONAL");

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8" data-testid="page-billing">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-bold">Abbonamento e Prezzi</h1>
          <p className="text-muted-foreground mt-2">
            Scegli il piano perfetto per il tuo ambulatorio. Switcha tra i piani per vedere le differenze.
          </p>
        </div>

        <Tabs defaultValue="PROFESSIONAL" value={selectedTab} onValueChange={(v) => setSelectedTab(v as PlanKey)} className="w-full">
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-plans">
            <TabsTrigger value="BASE" data-testid="tab-base">
              Base
            </TabsTrigger>
            <TabsTrigger value="PROFESSIONAL" data-testid="tab-professional">
              <div className="flex items-center gap-2">
                Professional
                <Sparkles className="h-3 w-3" />
              </div>
            </TabsTrigger>
            <TabsTrigger value="ENTERPRISE" data-testid="tab-enterprise">
              Enterprise
            </TabsTrigger>
          </TabsList>

          {(Object.keys(PLANS) as Array<PlanKey>).map((planKey) => {
            const plan = PLANS[planKey];
            const isCurrentPlan = currentPlan === planKey;
            const planDetails = PLAN_DETAILS[planKey];

            return (
              <TabsContent key={planKey} value={planKey} className="mt-6">
                <Card className={`${isCurrentPlan ? "border-primary" : ""}`} data-testid={`card-plan-${planKey.toLowerCase()}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-3xl" data-testid={`text-plan-name-${planKey.toLowerCase()}`}>
                          {planDetails.name}
                        </CardTitle>
                        <CardDescription className="mt-2 text-base">
                          {plan.description}
                        </CardDescription>
                      </div>
                      {isCurrentPlan && (
                        <Badge variant="default" data-testid="badge-current-plan">
                          Piano Attuale
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <span className="text-5xl font-bold" data-testid={`text-price-${planKey.toLowerCase()}`}>
                        €{planDetails.price}
                      </span>
                      <span className="text-muted-foreground ml-2 text-lg">{planDetails.period}</span>
                    </div>

                    <div className="flex gap-6 mt-6">
                      <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Pazienti</p>
                          <p className="text-lg font-semibold" data-testid={`text-patient-limit-${planKey.toLowerCase()}`}>
                            {plan.limits.pazienti === -1 ? "Illimitati" : plan.limits.pazienti.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Utenti</p>
                          <p className="text-lg font-semibold" data-testid={`text-user-limit-${planKey.toLowerCase()}`}>
                            {plan.limits.utenti === -1 ? "Illimitati" : plan.limits.utenti}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg mb-4">Funzionalità Incluse</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm" data-testid={`feature-${feature}`}>
                              {FEATURE_NAMES[feature] || feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-3">
                    {isCurrentPlan ? (
                      <Button variant="outline" disabled data-testid={`button-current-${planKey.toLowerCase()}`} className="flex-1">
                        Piano Attuale
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        onClick={() => handlePlanSelect(planKey)}
                        data-testid={`button-request-${planKey.toLowerCase()}`}
                        className="flex-1"
                      >
                        Richiedi Demo Gratuita
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

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
