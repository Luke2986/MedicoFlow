import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Settings, Bell, Layout, Table2, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/lib/useUser';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserPreferences } from '@shared/schema';

export default function PreferenzePage() {
  const { userId } = useUser();
  const { toast } = useToast();
  
  const [theme, setTheme] = useState<string>('light');
  const [dashboardLayout, setDashboardLayout] = useState<string[]>([]);
  const [notifications, setNotifications] = useState({
    email: false,
    sms: false,
    push: false,
    reminder24h: true
  });
  const [tableSettings, setTableSettings] = useState({
    density: 'comfortable',
    pagination: 10
  });

  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ['/api/preferences', userId],
    enabled: !!userId,
    retry: false
  });

  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme || 'light');
      setDashboardLayout(preferences.dashboardLayout || []);
      
      try {
        const notif = typeof preferences.notifications === 'string' 
          ? JSON.parse(preferences.notifications) 
          : preferences.notifications || {};
        setNotifications({
          email: notif.email || false,
          sms: notif.sms || false,
          push: notif.push || false,
          reminder24h: notif.reminder24h !== false
        });
      } catch (e) {
        console.error('Error parsing notifications:', e);
      }

      try {
        const table = typeof preferences.tableSettings === 'string'
          ? JSON.parse(preferences.tableSettings)
          : preferences.tableSettings || {};
        setTableSettings({
          density: table.density || 'comfortable',
          pagination: table.pagination || 10
        });
      } catch (e) {
        console.error('Error parsing table settings:', e);
      }
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/preferences/${userId}`, {
        theme,
        dashboardLayout,
        notifications: JSON.stringify(notifications),
        tableSettings: JSON.stringify(tableSettings)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/preferences', userId] });
      toast({
        title: 'Preferenze salvate',
        description: 'Le tue preferenze sono state aggiornate con successo.'
      });
      
      const isDark = document.documentElement.classList.contains('dark');
      const currentTheme = isDark ? 'dark' : 'light';
      if (theme !== currentTheme) {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    onError: () => {
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le preferenze.',
        variant: 'destructive'
      });
    }
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
            <Button variant="ghost" size="icon" className="hover-elevate">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Preferenze</h1>
            <p className="text-muted-foreground mt-1">
              Caricamento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-preferenze-title">
            Preferenze Utente
          </h1>
          <p className="text-muted-foreground mt-1">
            Personalizza l'esperienza della tua applicazione
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending || isLoading}
          data-testid="button-save-preferences"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Salvataggio...' : 'Salva Modifiche'}
        </Button>
      </div>

      {/* Tema */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Tema Interfaccia</h3>
              <p className="text-sm text-muted-foreground">
                Scegli come visualizzare l'applicazione
              </p>
            </div>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" data-testid="radio-theme-light" />
                <Label htmlFor="theme-light" className="cursor-pointer">Chiaro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" data-testid="radio-theme-dark" />
                <Label htmlFor="theme-dark" className="cursor-pointer">Scuro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="auto" id="theme-auto" data-testid="radio-theme-auto" />
                <Label htmlFor="theme-auto" className="cursor-pointer">Automatico (sistema)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Notifiche */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Notifiche & Promemoria</h3>
              <p className="text-sm text-muted-foreground">
                Gestisci come ricevere aggiornamenti e promemoria
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-email" className="text-sm font-medium">Email</Label>
                  <p className="text-xs text-muted-foreground">
                    Ricevi notifiche via email
                  </p>
                </div>
                <Switch
                  id="notif-email"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  data-testid="switch-notif-email"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-sms" className="text-sm font-medium">SMS</Label>
                  <p className="text-xs text-muted-foreground">
                    Ricevi notifiche via SMS
                  </p>
                </div>
                <Switch
                  id="notif-sms"
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                  data-testid="switch-notif-sms"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-push" className="text-sm font-medium">Notifiche Push</Label>
                  <p className="text-xs text-muted-foreground">
                    Ricevi notifiche push nel browser
                  </p>
                </div>
                <Switch
                  id="notif-push"
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  data-testid="switch-notif-push"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-reminder" className="text-sm font-medium">Promemoria 24h</Label>
                  <p className="text-xs text-muted-foreground">
                    Invia promemoria ai pazienti 24h prima dell'appuntamento
                  </p>
                </div>
                <Switch
                  id="notif-reminder"
                  checked={notifications.reminder24h}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, reminder24h: checked })}
                  data-testid="switch-notif-reminder"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabelle */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <Table2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Impostazioni Tabelle</h3>
              <p className="text-sm text-muted-foreground">
                Personalizza la visualizzazione delle tabelle
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Densità</Label>
                <RadioGroup value={tableSettings.density} onValueChange={(value) => setTableSettings({ ...tableSettings, density: value })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="density-compact" data-testid="radio-density-compact" />
                    <Label htmlFor="density-compact" className="cursor-pointer">Compatta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comfortable" id="density-comfortable" data-testid="radio-density-comfortable" />
                    <Label htmlFor="density-comfortable" className="cursor-pointer">Confortevole</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="spacious" id="density-spacious" data-testid="radio-density-spacious" />
                    <Label htmlFor="density-spacious" className="cursor-pointer">Spaziosa</Label>
                  </div>
                </RadioGroup>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-3 block">Righe per pagina</Label>
                <RadioGroup value={tableSettings.pagination.toString()} onValueChange={(value) => setTableSettings({ ...tableSettings, pagination: parseInt(value) })}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="pagination-10" data-testid="radio-pagination-10" />
                    <Label htmlFor="pagination-10" className="cursor-pointer">10 righe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="25" id="pagination-25" data-testid="radio-pagination-25" />
                    <Label htmlFor="pagination-25" className="cursor-pointer">25 righe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50" id="pagination-50" data-testid="radio-pagination-50" />
                    <Label htmlFor="pagination-50" className="cursor-pointer">50 righe</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
