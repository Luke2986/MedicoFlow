import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Activity, Calendar, Users, FileText, Shield, Clock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden bg-linear-to-br from-primary/95 via-primary to-primary/90 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAxMmMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptLTEyIDEyYzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xs border border-white/20">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Sistema Gestionale Professionale</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              MedicoFlow
            </h1>
            
            <p className="text-xl lg:text-2xl text-blue-50 max-w-3xl mx-auto font-light">
              Gestionale moderno per ambulatori medici italiani
            </p>
            
            <p className="text-lg text-blue-100/90 max-w-2xl mx-auto">
              Gestisci pazienti, appuntamenti e cartelle cliniche in modo efficiente. 
              Tutto quello che ti serve per un ambulatorio organizzato e professionale.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg h-12 px-8 text-base font-semibold"
                data-testid="button-dashboard"
              >
                <Link href="/dashboard">
                  Accedi alla Dashboard
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline" 
                className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-xs h-12 px-8 text-base font-semibold"
                data-testid="button-learn-more"
              >
                <a href="#features">
                  Scopri le funzionalità
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Funzionalità Principali
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tutto ciò che serve per gestire il tuo ambulatorio in modo professionale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-patients">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Gestione Pazienti
            </h3>
            <p className="text-muted-foreground">
              Anagrafica completa, storico visite e documentazione. Tutto organizzato e sempre a portata di mano.
            </p>
          </div>

          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-appointments">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Calendario Appuntamenti
            </h3>
            <p className="text-muted-foreground">
              Pianifica e gestisci gli appuntamenti con facilità. Vista giornaliera, settimanale e mensile.
            </p>
          </div>

          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-records">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Cartella Clinica
            </h3>
            <p className="text-muted-foreground">
              Documentazione medica digitale completa. Anamnesi, diagnosi e terapie in formato strutturato.
            </p>
          </div>

          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-security">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Sicurezza e Privacy
            </h3>
            <p className="text-muted-foreground">
              Conforme al GDPR italiano. I tuoi dati medici sono protetti e al sicuro.
            </p>
          </div>

          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-speed">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Risparmio di Tempo
            </h3>
            <p className="text-muted-foreground">
              Automatizza le attività ripetitive e dedica più tempo ai tuoi pazienti.
            </p>
          </div>

          <div className="group p-6 rounded-lg border border-border bg-card hover-elevate active-elevate-2 transition-all" data-testid="feature-reports">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">
              Report e Statistiche
            </h3>
            <p className="text-muted-foreground">
              Monitora l'andamento del tuo ambulatorio con report dettagliati e statistiche utili.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-muted-foreground">
            © 2024 MedicoFlow. Sistema gestionale per ambulatori medici italiani.
          </p>
        </div>
      </div>
    </div>
  );
}
