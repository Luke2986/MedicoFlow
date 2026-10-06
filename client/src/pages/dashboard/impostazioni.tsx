import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Building2,
  CreditCard,
  Users,
  Bell,
  Shield,
  HelpCircle,
  Settings as SettingsIcon,
  ChevronRight,
  Palette,
  Sliders
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { type Ambulatorio, type Subscription } from "@shared/schema";

interface SettingsSection {
  title: string;
  description: string;
  icon: typeof Building2;
  href: string;
  color: string;
  badge?: string | null;
}

const colorClasses: Record<string, string> = {
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
  red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  gray: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
};

export default function Impostazioni() {
  const { ambulatorioId } = useAmbulatorio();
  const { data: ambulatorio, isLoading: loadingAmbulatorio } = useQuery<Ambulatorio>({
    queryKey: ["/api/ambulatori", ambulatorioId],
    queryFn: async () => {
      const res = await fetch(`/api/ambulatori/${ambulatorioId}`);
      if (!res.ok) throw new Error("Errore caricamento ambulatorio");
      return res.json();
    },
    enabled: !!ambulatorioId,
  });

  const { data: subscription, isLoading: loadingSubscription } = useQuery<Subscription>({
    queryKey: ["/api/subscription", ambulatorioId],
    queryFn: async () => {
      const res = await fetch(`/api/subscription?ambulatorioId=${ambulatorioId}`);
      if (!res.ok) throw new Error("Errore caricamento subscription");
      return res.json();
    },
    enabled: !!ambulatorioId,
  });

  const sections: SettingsSection[] = [
    {
      title: "Dati Ambulatorio",
      description: "Informazioni struttura, orari di apertura, contatti",
      icon: Building2,
      href: "/dashboard/impostazioni/ambulatorio",
      color: "purple"
    },
    {
      title: "Piani & Fatturazione",
      description: subscription ? `Piano attuale: ${subscription.piano}` : "Gestisci il tuo piano di abbonamento",
      icon: CreditCard,
      href: "/dashboard/impostazioni/billing",
      color: "green",
      badge: subscription?.piano === "PROFESSIONAL" ? "PRO" : subscription?.piano === "ENTERPRISE" ? "ENTERPRISE" : null
    },
    {
      title: "Aspetto",
      description: "Personalizza colori e tema della piattaforma",
      icon: Palette,
      href: "/dashboard/impostazioni/aspetto",
      color: "indigo",
      badge: "AI"
    },
    {
      title: "Preferenze Utente",
      description: "Tema, notifiche, layout dashboard e tabelle",
      icon: Sliders,
      href: "/dashboard/impostazioni/preferenze",
      color: "gray"
    },
    {
      title: "Gestione Team",
      description: "Aggiungi collaboratori, gestisci permessi",
      icon: Users,
      href: "/dashboard/impostazioni/team",
      color: "orange"
    },
    {
      title: "Notifiche & Reminder",
      description: "Configura promemoria SMS, email, push",
      icon: Bell,
      href: "/dashboard/impostazioni/notifiche",
      color: "yellow"
    },
    {
      title: "Privacy & Sicurezza",
      description: "GDPR, consensi, backup dati, log accessi",
      icon: Shield,
      href: "/dashboard/impostazioni/privacy",
      color: "red"
    },
    {
      title: "Supporto & Documentazione",
      description: "Guide, FAQ, contatta assistenza",
      icon: HelpCircle,
      href: "/dashboard/impostazioni/supporto",
      color: "gray"
    }
  ];

  const isLoading = loadingAmbulatorio || loadingSubscription;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-impostazioni-title">
          Impostazioni
        </h1>
        <p className="text-muted-foreground">
          Configura il tuo ambulatorio e personalizza l'esperienza
        </p>
      </div>

      {/* Quick Info Banner */}
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1" data-testid="text-ambulatorio-nome">
                {ambulatorio?.nome || "Ambulatorio"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {ambulatorio?.citta}, {ambulatorio?.provincia} • {ambulatorio?.specializzazione}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Piano attuale</p>
              <p className="font-semibold text-foreground" data-testid="text-piano-corrente">
                {subscription?.piano || "BASE"}
              </p>
              {subscription?.status === "TRIAL" && (
                <Badge variant="secondary" className="mt-1">Trial</Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              data-testid={`link-${section.title.toLowerCase().replace(/[^a-z]+/g, '-')}`}
            >
              <Card className="group p-6 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover-elevate active-elevate-2 cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colorClasses[section.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {section.title}
                      </h3>
                      {section.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {section.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground break-words">
                      {section.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Footer Info */}
      <Card className="bg-muted/50 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            <span>MedicoFlow v1.0.0</span>
          </div>
          <div>
            Ultima sincronizzazione: oggi alle {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </Card>
    </div>
  );
}
