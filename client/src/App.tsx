import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Dashboard from "@/pages/dashboard/index";
import Pazienti from "@/pages/dashboard/pazienti";
import PazienteDettaglio from "@/pages/dashboard/pazienti/[id]";
import Appuntamenti from "@/pages/dashboard/appuntamenti";
import CartellaClinica from "@/pages/dashboard/cartella-clinica";
import Impostazioni from "@/pages/dashboard/impostazioni";
import Billing from "@/pages/dashboard/billing";
import ImpostazioniAmbulatorio from "@/pages/dashboard/impostazioni/ambulatorio";
import ImpostazioniTeam from "@/pages/dashboard/impostazioni/team";
import ImpostazioniNotifiche from "@/pages/dashboard/impostazioni/notifiche";
import ImpostazioniPrivacy from "@/pages/dashboard/impostazioni/privacy";
import ImpostazioniSupporto from "@/pages/dashboard/impostazioni/supporto";
import ImpostazioniAspetto from "@/pages/dashboard/impostazioni/aspetto";
import Pricing from "@/pages/pricing";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/pazienti" component={() => (
        <DashboardLayout>
          <Pazienti />
        </DashboardLayout>
      )} />
      <Route path="/dashboard/pazienti/:id" component={() => (
        <DashboardLayout>
          <PazienteDettaglio />
        </DashboardLayout>
      )} />
      <Route path="/dashboard/appuntamenti">
        <DashboardLayout>
          <Appuntamenti />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/cartella-clinica">
        <DashboardLayout>
          <CartellaClinica />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni">
        <DashboardLayout>
          <Impostazioni />
        </DashboardLayout>
      </Route>
      <Route path="/billing">
        <DashboardLayout>
          <Billing />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/billing">
        <DashboardLayout>
          <Billing />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/ambulatorio">
        <DashboardLayout>
          <ImpostazioniAmbulatorio />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/team">
        <DashboardLayout>
          <ImpostazioniTeam />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/notifiche">
        <DashboardLayout>
          <ImpostazioniNotifiche />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/privacy">
        <DashboardLayout>
          <ImpostazioniPrivacy />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/supporto">
        <DashboardLayout>
          <ImpostazioniSupporto />
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/impostazioni/aspetto">
        <DashboardLayout>
          <ImpostazioniAspetto />
        </DashboardLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
