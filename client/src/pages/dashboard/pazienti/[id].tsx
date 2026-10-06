import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  AlertTriangle, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  Plus,
  Edit2,
  Trash2,
  FileText,
  Pill,
  Activity,
  Download
} from "lucide-react";
import { format, differenceInYears, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { Paziente, Visita } from "@shared/schema";
import { useAmbulatorio } from "@/lib/useAmbulatorio";

interface PazienteConVisite extends Paziente {
  visite?: Visita[];
}

export default function PazienteDettaglio() {
  const params = useParams();
  const pazienteId = params.id;
  const { ambulatorioId } = useAmbulatorio();

  const { data: paziente, isLoading: isPazienteLoading } = useQuery<PazienteConVisite>({
    queryKey: ["/api/pazienti", pazienteId],
    queryFn: async () => {
      const res = await fetch(`/api/pazienti/${pazienteId}?ambulatorioId=${ambulatorioId}`);
      if (!res.ok) throw new Error("Paziente non trovato");
      return res.json();
    },
    enabled: !!pazienteId && !!ambulatorioId,
  });

  const { data: visite = [] } = useQuery<Visita[]>({
    queryKey: ["/api/visite", pazienteId],
    queryFn: async () => {
      const res = await fetch(`/api/visite?ambulatorioId=${ambulatorioId}&pazienteId=${pazienteId}`);
      if (!res.ok) throw new Error("Errore caricamento visite");
      return res.json();
    },
    enabled: !!pazienteId && !!ambulatorioId,
  });

  if (isPazienteLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento paziente...</p>
        </div>
      </div>
    );
  }

  if (!paziente) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Paziente non trovato</p>
        <Link href="/dashboard/pazienti">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna ai Pazienti
          </Button>
        </Link>
      </div>
    );
  }

  const visiteSortedCronologicamente = [...visite].sort((a, b) => 
    new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime()
  );

  const età = differenceInYears(new Date(), new Date(paziente.dataNascita));
  const ultimaVisita = visiteSortedCronologicamente[0];
  const giorniDaUltimaVisita = ultimaVisita 
    ? formatDistanceToNow(new Date(ultimaVisita.dataVisita), { addSuffix: true, locale: it })
    : null;

  const hasAllergie = paziente.allergie && paziente.allergie.length > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground" data-testid="breadcrumb-nav">
        <Link href="/dashboard/pazienti" className="hover:text-foreground hover-elevate px-2 py-1 rounded">
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
          Pazienti
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {paziente.cognome} {paziente.nome}
        </span>
      </nav>

      {/* Header Paziente Fisso */}
      <Card data-testid="card-header-paziente">
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <CardTitle className="text-2xl sm:text-3xl font-bold">
                {paziente.cognome} {paziente.nome}
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  CF: {paziente.codiceFiscale}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {età} anni
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  window.open(`/api/pazienti/${pazienteId}/cartella-pdf`, '_blank');
                }}
                className="w-full sm:w-auto border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                data-testid="button-esporta-cartella-pdf"
              >
                <Download className="h-4 w-4 mr-2" />
                Esporta PDF
              </Button>
              <Link href={`/dashboard/cartella-clinica?pazienteId=${pazienteId}`}>
                <Button className="w-full md:w-auto" data-testid="button-nuova-visita">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Visita
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Contatti */}
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href={`tel:${paziente.telefono}`} 
              className="flex items-center gap-2 text-sm hover:text-primary hover-elevate p-2 rounded"
            >
              <Phone className="h-4 w-4" />
              <span>{paziente.telefono}</span>
            </a>
            {paziente.email && (
              <a 
                href={`mailto:${paziente.email}`} 
                className="flex items-center gap-2 text-sm hover:text-primary hover-elevate p-2 rounded"
              >
                <Mail className="h-4 w-4" />
                <span>{paziente.email}</span>
              </a>
            )}
          </div>

          {/* Statistiche */}
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Visite totali: </span>
                <strong>{visite.length}</strong>
              </div>
              {giorniDaUltimaVisita && (
                <div>
                  <span className="text-muted-foreground">Ultima visita: </span>
                  <strong>{giorniDaUltimaVisita}</strong>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Box Allergie */}
      {hasAllergie && (
        <Alert className="bg-red-50 dark:bg-red-950 border-l-4 border-l-red-500 border-red-200 dark:border-red-800" data-testid="alert-allergie">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold text-red-900 dark:text-red-100">⚠️ ALLERGIE E PATOLOGIE</p>
              <ul className="list-disc list-inside space-y-1 text-red-800 dark:text-red-200">
                {paziente.allergie!.map((allergia, i) => (
                  <li key={i}>{allergia}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Storico Visite */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Storico Clinico ({visite.length} visite)
          </h2>
        </div>

        {visite.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Nessuna visita registrata</p>
              <Link href={`/dashboard/cartella-clinica?pazienteId=${pazienteId}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Registra Prima Visita
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {visiteSortedCronologicamente.map((visita) => (
              <Card 
                key={visita.id} 
                className="hover:shadow-lg transition-shadow"
                data-testid={`card-visita-${visita.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl">
                        {format(new Date(visita.dataVisita), "d MMMM yyyy", { locale: it })}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {visita.motivoVisita}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {/* TODO: Implement edit */}}
                        data-testid={`button-edit-${visita.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {/* TODO: Implement delete */}}
                        data-testid={`button-delete-${visita.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Diagnosi - Box evidenziato */}
                  {visita.diagnosi && (
                    <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-600 p-4 rounded">
                      <div className="flex items-start gap-2">
                        <Activity className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1 flex-1">
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase">
                            Diagnosi
                          </p>
                          <p className="text-sm text-blue-900 dark:text-blue-100">
                            {visita.diagnosi}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terapia */}
                  {visita.terapia && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Terapia
                        </p>
                      </div>
                      <p className="text-sm line-clamp-2 pl-6">{visita.terapia}</p>
                    </div>
                  )}

                  {/* Anamnesi */}
                  {visita.anamnesi && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                          Anamnesi
                        </p>
                      </div>
                      <p className="text-sm line-clamp-2 pl-6">{visita.anamnesi}</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t pt-4">
                  <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(visita.dataVisita), "HH:mm", { locale: it })}
                    </div>
                    <Link href={`/dashboard/cartella-clinica?pazienteId=${pazienteId}`}>
                      <Button variant="ghost" className="text-primary">
                        Vedi cartella completa →
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
