import { Card } from "@/components/ui/card";
import { Users, Calendar, FileText, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import OnboardingWizard from "@/components/OnboardingWizard";
import OnboardingSetupWizard from "@/components/OnboardingSetupWizard";
import QuickActions from "@/components/QuickActions";
import EmptyState from "@/components/EmptyState";
import { useState, useEffect } from "react";
import type { Ambulatorio } from "@shared/schema";

interface Stats {
  totalePazienti: number;
  appuntamentiOggi: number;
  appuntamentiSettimana: number;
  tassoAttivita: number;
}

export default function Dashboard() {
  const { ambulatorioId } = useAmbulatorio();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const { data: ambulatorio } = useQuery<Ambulatorio>({
    queryKey: ["/api/ambulatori", ambulatorioId],
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats", ambulatorioId],
    queryFn: () => fetch(`/api/stats?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const { data: appuntamenti = [] } = useQuery<any[]>({
    queryKey: ["/api/appuntamenti", ambulatorioId],
    queryFn: () => fetch(`/api/appuntamenti?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  useEffect(() => {
    // Only show wizard if ambulatorio needs setup AND user hasn't manually completed it
    if (ambulatorio && !ambulatorio.specializationId && !setupCompleted) {
      setShowSetupWizard(true);
    } else {
      setShowSetupWizard(false);
    }
  }, [ambulatorio, setupCompleted]);

  const handleSetupComplete = () => {
    setSetupCompleted(true);
    setShowSetupWizard(false);
  };

  const hasPazienti = (stats?.totalePazienti || 0) > 0;
  const hasAppuntamenti = (stats?.appuntamentiOggi || 0) > 0 || appuntamenti.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Panoramica dell'attività del tuo ambulatorio
        </p>
      </div>

      {/* Setup Wizard - First Time */}
      {ambulatorioId && ambulatorioId !== "default-ambulatorio-id" && (
        <OnboardingSetupWizard 
          ambulatorioId={ambulatorioId} 
          open={showSetupWizard}
          onComplete={handleSetupComplete}
        />
      )}

      {/* Onboarding Wizard - Progress Tracker */}
      {ambulatorioId && ambulatorioId !== "default-ambulatorio-id" && !showSetupWizard && (
        <OnboardingWizard ambulatorioId={ambulatorioId} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover-elevate active-elevate-2 transition-all" data-testid="card-stat-pazienti">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Pazienti Totali</p>
            <p className="text-3xl font-bold text-card-foreground">
              {isLoading ? "..." : stats?.totalePazienti || 0}
            </p>
          </div>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 transition-all" data-testid="card-stat-appuntamenti">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-chart-2" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Appuntamenti Oggi</p>
            <p className="text-3xl font-bold text-card-foreground">
              {isLoading ? "..." : stats?.appuntamentiOggi || 0}
            </p>
          </div>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 transition-all" data-testid="card-stat-visite">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-chart-3" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Visite Settimana</p>
            <p className="text-3xl font-bold text-card-foreground">
              {isLoading ? "..." : stats?.appuntamentiSettimana || 0}
            </p>
          </div>
        </Card>

        <Card className="p-6 hover-elevate active-elevate-2 transition-all" data-testid="card-stat-attivita">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-chart-4" />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tasso di Attività</p>
            <p className="text-3xl font-bold text-card-foreground">
              {isLoading ? "..." : `${stats?.tassoAttivita || 0}%`}
            </p>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions hasPazienti={hasPazienti} hasAppuntamenti={hasAppuntamenti} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">
            Prossimi Appuntamenti
          </h2>
          {appuntamenti.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nessun appuntamento oggi"
              description="Inizia a pianificare le visite per i tuoi pazienti"
              actionLabel="Crea Appuntamento"
              actionHref="/dashboard/appuntamenti"
              secondaryAction={{
                label: "Vedi Calendario",
                href: "/dashboard/appuntamenti"
              }}
            />
          ) : (
            <div className="space-y-3">
              {appuntamenti.slice(0, 5).map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 rounded-md hover-elevate border border-border">
                  <div>
                    <p className="font-medium text-card-foreground">{app.tipo}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(app.dataOra).toLocaleString('it-IT', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                    app.stato === 'confermato' ? 'bg-chart-2/10 text-chart-2' :
                    app.stato === 'in_attesa' ? 'bg-chart-3/10 text-chart-3' :
                    'bg-chart-4/10 text-chart-4'
                  }`}>
                    {app.stato}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-card-foreground">
            Attività Recente
          </h2>
          {!hasPazienti ? (
            <EmptyState
              icon={Users}
              title="Aggiungi il tuo primo paziente"
              description="Inizia a gestire le cartelle cliniche dei tuoi pazienti in modo digitale e organizzato"
              actionLabel="Aggiungi Paziente"
              actionHref="/dashboard/pazienti"
            />
          ) : (
            <EmptyState
              icon={Activity}
              title="Nessuna attività recente"
              description="Le attività verranno visualizzate qui"
              actionLabel="Vedi Pazienti"
              actionHref="/dashboard/pazienti"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
