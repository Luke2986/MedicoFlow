import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, X, CheckCircle2, ArrowLeft } from "lucide-react";

type PlanDetail = {
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
};

const PLAN_DETAILS: Record<"BASE" | "PROFESSIONAL" | "ENTERPRISE", PlanDetail> = {
  BASE: {
    name: "BASE",
    price: 189,
    description: "Ideale per studi singoli",
    features: [
      "1-2 utenti",
      "Gestione pazienti & appuntamenti",
      "Cartella clinica digitale",
      "Dashboard KPI",
      "Supporto email"
    ],
  },
  PROFESSIONAL: {
    name: "PROFESSIONAL",
    price: 249,
    description: "Per piccoli team medici",
    features: [
      "Tutto di BASE, più:",
      "✨ AI Voice-to-Clinical-Note",
      "✨ Ricerca AI intelligente",
      "Fino a 5 utenti",
      "SMS Reminder automatici",
      "FSE 2.0 compliant",
      "Booking online pazienti",
      "Supporto prioritario"
    ],
    popular: true,
  },
  ENTERPRISE: {
    name: "ENTERPRISE",
    price: 599,
    description: "Per poliambulatori",
    features: [
      "Tutto di PROFESSIONAL, più:",
      "Trascrizione vocale illimitata",
      "Analytics avanzati",
      "Fino a 15 utenti",
      "Telemedicina integrata",
      "White-label disponibile",
      "Manager dedicato",
      "Supporto 24/7"
    ],
  },
};

export default function Pricing() {
  const [, setLocation] = useLocation();
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-8"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Home
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Scegli il Piano Perfetto per il Tuo Ambulatorio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trasparenza totale. Nessun costo nascosto. Cancella quando vuoi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {(Object.keys(PLAN_DETAILS) as Array<keyof typeof PLAN_DETAILS>).map((key) => {
            const plan = PLAN_DETAILS[key];

            return (
              <Card
                key={key}
                className={`relative ${
                  plan.popular ? "border-primary shadow-2xl scale-105" : "border-border shadow-lg hover:shadow-xl"
                } transition-all`}
                data-testid={`card-plan-${key.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      PIÙ POPOLARE
                    </span>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl mb-2" data-testid={`text-plan-name-${key.toLowerCase()}`}>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-sm mb-4">{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold" data-testid={`text-price-${key.toLowerCase()}`}>
                      €{plan.price}
                    </span>
                    <span className="text-muted-foreground">/mese</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handlePlanSelect(key)}
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    data-testid={`button-select-${key.toLowerCase()}`}
                  >
                    Richiedi Demo Gratuita
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            🔒 Conforme GDPR • ✅ FSE 2.0 Ready • 🏥 Usato da centinaia di ambulatori
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
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
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
