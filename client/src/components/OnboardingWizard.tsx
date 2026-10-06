import { useState, useEffect } from 'react';
import { X, Check, ChevronRight, User, Users, Calendar, Palette } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  href: string;
  completed: boolean;
}

interface OnboardingWizardProps {
  ambulatorioId: string;
}

export default function OnboardingWizard({ ambulatorioId }: OnboardingWizardProps) {
  const [show, setShow] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['/api/onboarding', ambulatorioId],
    queryFn: async () => {
      const res = await fetch(`/api/onboarding?ambulatorioId=${ambulatorioId}`);
      if (!res.ok) throw new Error('Failed to fetch onboarding progress');
      return res.json();
    },
    enabled: !!ambulatorioId
  });

  useEffect(() => {
    if (data?.progress && !data.progress.onboardingCompleted) {
      const dismissed = localStorage.getItem('onboarding_dismissed');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, [data]);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('onboarding_dismissed', 'true');
  };

  if (isLoading || !show || !data?.progress) return null;

  const progress = data.progress;

  const steps: OnboardingStep[] = [
    {
      id: 'profile',
      title: 'Completa il Profilo',
      description: 'Aggiungi i dati del tuo ambulatorio',
      icon: User,
      href: '/dashboard/impostazioni/ambulatorio',
      completed: progress.profileCompleted
    },
    {
      id: 'patient',
      title: 'Aggiungi un Paziente',
      description: 'Inserisci il tuo primo paziente',
      icon: Users,
      href: '/dashboard/pazienti',
      completed: progress.firstPatientAdded
    },
    {
      id: 'appointment',
      title: 'Crea un Appuntamento',
      description: 'Pianifica la prima visita',
      icon: Calendar,
      href: '/dashboard/appuntamenti',
      completed: progress.firstAppointmentAdded
    },
    {
      id: 'theme',
      title: 'Personalizza Aspetto',
      description: 'Configura i colori del brand',
      icon: Palette,
      href: '/dashboard/impostazioni/aspetto',
      completed: progress.themeCustomized
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <div className="bg-linear-to-br from-primary/10 to-primary/20 rounded-xl border-2 border-primary/30 p-6 relative overflow-hidden" data-testid="onboarding-wizard">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1 hover:bg-primary/20 rounded-lg transition-colors"
        data-testid="button-dismiss-onboarding"
      >
        <X className="w-5 h-5 text-primary" />
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Benvenuto su MedicoFlow! 🎉
        </h2>
        <p className="text-muted-foreground">
          Completa questi passaggi per configurare il tuo ambulatorio
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            Progresso: {completedSteps}/{steps.length}
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-primary/20 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
            data-testid="progress-bar"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.id}
              href={step.href}
            >
              <div
                className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                  step.completed
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-card border-primary/30 hover:border-primary hover:shadow-md'
                }`}
                data-testid={`onboarding-step-${step.id}`}
              >
                <div className={`p-3 rounded-lg ${
                  step.completed ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/10'
                }`}>
                  {step.completed ? (
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!step.completed && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-1" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {completedSteps === steps.length && (
        <div className="mt-6 p-4 bg-green-100 dark:bg-green-950 border-2 border-green-300 dark:border-green-800 rounded-lg text-center" data-testid="onboarding-completed">
          <p className="text-green-800 dark:text-green-200 font-semibold">
            🎊 Congratulazioni! Hai completato la configurazione!
          </p>
        </div>
      )}
    </div>
  );
}
