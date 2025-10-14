import { Calendar, FileText, Users } from 'lucide-react';
import { Link } from 'wouter';

interface QuickActionsProps {
  hasPazienti: boolean;
  hasAppuntamenti: boolean;
}

export default function QuickActions({ hasPazienti, hasAppuntamenti }: QuickActionsProps) {
  const actions = [
    {
      icon: Users,
      label: 'Nuovo Paziente',
      href: '/dashboard/pazienti',
      color: 'blue' as const,
      priority: !hasPazienti
    },
    {
      icon: Calendar,
      label: 'Nuovo Appuntamento',
      href: '/dashboard/appuntamenti',
      color: 'green' as const,
      priority: hasPazienti && !hasAppuntamenti
    },
    {
      icon: FileText,
      label: 'Nuova Cartella',
      href: '/dashboard/cartella-clinica',
      color: 'purple' as const,
      priority: false,
      disabled: !hasPazienti
    }
  ];

  const priorityActions = actions.filter(a => a.priority);
  const normalActions = actions.filter(a => !a.priority);

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900',
    green: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900',
    purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900'
  };

  return (
    <div className="space-y-4">
      {priorityActions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            ⚡ Azioni Suggerite
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priorityActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                >
                  <div
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                      colorClasses[action.color]
                    }`}
                    data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="p-2 bg-background dark:bg-card rounded-lg">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {normalActions.map((action) => {
            const Icon = action.icon;
            return action.disabled ? (
              <div
                key={action.label}
                className="flex items-center gap-3 p-4 border-2 border-border rounded-lg opacity-50 cursor-not-allowed"
                data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}-disabled`}
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground">{action.label}</span>
              </div>
            ) : (
              <Link
                key={action.label}
                href={action.href}
              >
                <div
                  className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                    colorClasses[action.color]
                  }`}
                  data-testid={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{action.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
