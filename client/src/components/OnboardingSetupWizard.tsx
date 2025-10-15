import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Stethoscope, 
  Building2, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  Check,
  Users,
  Calendar,
  FileText,
  BarChart3
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Specialization, Ambulatorio } from '@shared/schema';

interface OnboardingSetupWizardProps {
  ambulatorioId: string;
  open: boolean;
  onComplete: () => void;
}

export default function OnboardingSetupWizard({ ambulatorioId, open, onComplete }: OnboardingSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: ambulatorio } = useQuery<Ambulatorio>({
    queryKey: ['/api/ambulatori', ambulatorioId],
    enabled: !!ambulatorioId
  });

  const { data: specializations = [] } = useQuery<Specialization[]>({
    queryKey: ['/api/specializations'],
  });

  const updateAmbulatorioMutation = useMutation({
    mutationFn: async (specializationId: string) => {
      return await apiRequest("PATCH", `/api/ambulatori/${ambulatorioId}`, { specializationId });
    }
  });

  const handleComplete = async () => {
    if (selectedSpecialization) {
      try {
        await updateAmbulatorioMutation.mutateAsync(selectedSpecialization);
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['/api/ambulatori', ambulatorioId] });
        await queryClient.invalidateQueries({ queryKey: ['/api/ambulatori-list'] });
        
        toast({
          title: "Onboarding completato!",
          description: "Il tuo ambulatorio è ora configurato correttamente."
        });
        
        // Close wizard after successful save
        onComplete();
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile salvare la specializzazione.",
          variant: "destructive"
        });
      }
    } else {
      onComplete();
    }
  };

  const steps = [
    {
      id: 'welcome',
      title: 'Benvenuto su MedicoFlow',
      content: (
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-foreground">
              Iniziamo il tuo percorso digitale
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ti guideremo attraverso la configurazione iniziale del tuo ambulatorio. 
              Bastano pochi minuti per iniziare a gestire pazienti e appuntamenti in modo efficiente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Card className="p-4 text-center hover-elevate">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Gestione Pazienti</p>
            </Card>
            <Card className="p-4 text-center hover-elevate">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Calendario</p>
            </Card>
            <Card className="p-4 text-center hover-elevate">
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Cartelle Cliniche</p>
            </Card>
            <Card className="p-4 text-center hover-elevate">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Statistiche</p>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'ambulatorio',
      title: 'Dati Ambulatorio',
      content: (
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Building2 className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Profilo Ambulatorio
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                I dati del tuo ambulatorio sono già stati configurati. Puoi aggiornarli in qualsiasi momento 
                dalla sezione Impostazioni.
              </p>
            </div>
          </div>
          
          {ambulatorio && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <p className="text-sm font-medium">{ambulatorio.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Città</Label>
                  <p className="text-sm font-medium">{ambulatorio.citta}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Telefono</Label>
                  <p className="text-sm font-medium">{ambulatorio.telefono}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium">{ambulatorio.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'specialization',
      title: 'Specializzazione Medica',
      content: (
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Seleziona la specializzazione principale del tuo ambulatorio per configurare 
            automaticamente i parametri vitali, diagnosi frequenti e azioni rapide più rilevanti.
          </p>
          <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
            {specializations.map((spec) => (
              <Card
                key={spec.id}
                className={`p-4 cursor-pointer transition-all hover-elevate ${
                  selectedSpecialization === spec.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border'
                }`}
                onClick={() => setSelectedSpecialization(spec.id)}
                data-testid={`card-specialization-${spec.slug}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedSpecialization === spec.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{spec.nome}</h4>
                      {selectedSpecialization === spec.id && (
                        <Check className="w-4 h-4 text-primary" data-testid="icon-selected" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {spec.descrizione}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'tutorial',
      title: 'Sei Pronto!',
      content: (
        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-2xl font-bold text-foreground">
              Configurazione Completata!
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Il tuo ambulatorio è pronto all'uso. Ecco alcune azioni rapide per iniziare:
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <Card className="p-4 hover-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Aggiungi il primo paziente</p>
                  <p className="text-xs text-muted-foreground">Crea la prima cartella clinica</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Pianifica un appuntamento</p>
                  <p className="text-xs text-muted-foreground">Organizza il tuo calendario</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 hover-elevate">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Personalizza l'aspetto</p>
                  <p className="text-xs text-muted-foreground">Configura i colori del brand</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )
    }
  ];

  const isLastStep = currentStep === steps.length - 1;
  const canProceed = currentStep === 2 ? selectedSpecialization !== null : true;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onComplete()}>
      <DialogContent className="sm:max-w-[600px]" data-testid="dialog-onboarding-wizard">
        <DialogHeader>
          <DialogTitle className="text-xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} di {steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[300px]">
          {steps[currentStep].content}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <div className="flex gap-1.5">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                  data-testid={`progress-step-${idx}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                data-testid="button-prev-step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Indietro
              </Button>
            )}
            {!isLastStep ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed}
                data-testid="button-next-step"
              >
                Avanti
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={updateAmbulatorioMutation.isPending}
                data-testid="button-complete-onboarding"
              >
                <Check className="w-4 h-4 mr-1" />
                {updateAmbulatorioMutation.isPending ? 'Salvataggio...' : 'Inizia'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
