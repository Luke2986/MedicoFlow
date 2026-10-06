import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar as CalendarIcon, User, Activity, Pencil, Trash2, ChevronRight, AlertTriangle, Phone, Mail, ArrowLeft, Stethoscope, Pill, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { useUser } from "@/lib/useUser";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { VoiceRecorder } from "@/components/ai/VoiceRecorder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, differenceInYears, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { Visita, Paziente } from "@shared/schema";

export default function CartellaClinica() {
  const { ambulatorioId } = useAmbulatorio();
  const { userId } = useUser();
  const [location] = useLocation();
  const [selectedPaziente, setSelectedPaziente] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [transcriptionText, setTranscriptionText] = useState<string>("");
  const [editTranscriptionText, setEditTranscriptionText] = useState<string>("");
  const { toast } = useToast();

  // Leggi pazienteId da URL params e seleziona automaticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pazienteIdFromUrl = urlParams.get('pazienteId');
    if (pazienteIdFromUrl) {
      setSelectedPaziente(pazienteIdFromUrl);
    }
  }, [location]);

  const { data: pazientiResponse } = useQuery<{ pazienti: Paziente[], pagination: any }>({
    queryKey: ["/api/pazienti", ambulatorioId],
    queryFn: () => fetch(`/api/pazienti?ambulatorioId=${ambulatorioId}&limit=1000`).then(r => r.json()),
    enabled: !!ambulatorioId,
  });

  const pazienti = pazientiResponse?.pazienti || [];

  const { data: visite = [], isLoading, isError } = useQuery<Visita[]>({
    queryKey: ["/api/visite", selectedPaziente],
    queryFn: async () => {
      const res = await fetch(`/api/visite?ambulatorioId=${ambulatorioId}&pazienteId=${selectedPaziente}`);
      if (!res.ok) throw new Error("Errore nel caricamento delle visite");
      return res.json();
    },
    enabled: !!selectedPaziente && selectedPaziente !== "",
  });

  const visiteSortedCronologicamente = [...visite].sort((a, b) => 
    new Date(b.dataVisita).getTime() - new Date(a.dataVisita).getTime()
  );

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/visite", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visite"] });
      setDialogOpen(false);
      setTranscriptionText(""); // Reset trascrizione
      toast({
        title: "Visita registrata",
        description: "La visita è stata aggiunta alla cartella clinica",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile registrare la visita",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/visite/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visite"] });
      setEditDialogOpen(false);
      setSelectedVisita(null);
      toast({
        title: "Visita aggiornata",
        description: "La visita è stata modificata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la visita",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/visite/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/visite"] });
      setDeleteDialogOpen(false);
      setSelectedVisita(null);
      toast({
        title: "Visita eliminata",
        description: "La visita è stata rimossa dalla cartella clinica",
      });
    },
  });

  const handleTranscription = (result: any) => {
    console.log('Trascrizione ricevuta:', result);
    
    // Usa il testo corretto se disponibile, altrimenti il testo raw
    const textToUse = result?.correctedText || result?.text;
    
    if (textToUse) {
      setTranscriptionText(textToUse);
      
      const correctionCount = result?.corrections?.length || 0;
      toast({
        title: "Trascrizione completata",
        description: correctionCount > 0 
          ? `${correctionCount} termini medici corretti automaticamente`
          : "Il testo è stato trascritto correttamente",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      pazienteId: selectedPaziente,
      dataVisita: new Date(formData.get("dataVisita") as string).toISOString(),
      motivoVisita: formData.get("motivoVisita") as string,
      anamnesi: formData.get("anamnesi") as string || null,
      esameObiettivo: formData.get("esameObiettivo") as string || null,
      esamiEseguiti: formData.get("esamiEseguiti") as string || null,
      diagnosi: formData.get("diagnosi") as string,
      terapia: formData.get("terapia") as string || null,
      prescrizioneFarmaci: formData.get("prescrizioneFarmaci") as string || null,
      noteCliniche: formData.get("noteCliniche") as string || null,
      peso: formData.get("peso") ? parseInt(formData.get("peso") as string) : null,
      altezza: formData.get("altezza") ? parseInt(formData.get("altezza") as string) : null,
      pressioneSistolica: formData.get("pressioneSistolica") ? parseInt(formData.get("pressioneSistolica") as string) : null,
      pressioneDiastolica: formData.get("pressioneDiastolica") ? parseInt(formData.get("pressioneDiastolica") as string) : null,
      frequenzaCardiaca: formData.get("frequenzaCardiaca") ? parseInt(formData.get("frequenzaCardiaca") as string) : null,
      temperatura: formData.get("temperatura") ? parseInt(formData.get("temperatura") as string) : null,
      ambulatorioId,
    };

    createMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedVisita) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data = {
      dataVisita: new Date(formData.get("dataVisita") as string).toISOString(),
      motivoVisita: formData.get("motivoVisita") as string,
      anamnesi: formData.get("anamnesi") as string || null,
      esameObiettivo: formData.get("esameObiettivo") as string || null,
      esamiEseguiti: formData.get("esamiEseguiti") as string || null,
      diagnosi: formData.get("diagnosi") as string,
      terapia: formData.get("terapia") as string || null,
      prescrizioneFarmaci: formData.get("prescrizioneFarmaci") as string || null,
      noteCliniche: formData.get("noteCliniche") as string || null,
      peso: formData.get("peso") ? parseInt(formData.get("peso") as string) : null,
      altezza: formData.get("altezza") ? parseInt(formData.get("altezza") as string) : null,
      pressioneSistolica: formData.get("pressioneSistolica") ? parseInt(formData.get("pressioneSistolica") as string) : null,
      pressioneDiastolica: formData.get("pressioneDiastolica") ? parseInt(formData.get("pressioneDiastolica") as string) : null,
      frequenzaCardiaca: formData.get("frequenzaCardiaca") ? parseInt(formData.get("frequenzaCardiaca") as string) : null,
      temperatura: formData.get("temperatura") ? parseInt(formData.get("temperatura") as string) : null,
    };

    updateMutation.mutate({ id: selectedVisita.id, data });
  };

  const pazienteSelezionato = pazienti.find(p => p.id === selectedPaziente);
  
  // Calcolo età e ultima visita
  const eta = pazienteSelezionato ? differenceInYears(new Date(), new Date(pazienteSelezionato.dataNascita)) : 0;
  const ultimaVisita = visiteSortedCronologicamente[0];
  const giorniDaUltimaVisita = ultimaVisita 
    ? formatDistanceToNow(new Date(ultimaVisita.dataVisita), { addSuffix: true, locale: it })
    : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {selectedPaziente && pazienteSelezionato && (
        <nav className="flex items-center gap-2 text-sm" data-testid="breadcrumb-nav">
          <Link href="/dashboard/pazienti" className="text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Pazienti
          </Link>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">
            {pazienteSelezionato.cognome} {pazienteSelezionato.nome}
          </span>
        </nav>
      )}

      {/* Seleziona Paziente (solo se non selezionato) */}
      {!selectedPaziente && (
        <>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-cartella-title">
              Cartella Clinica
            </h1>
            <p className="text-muted-foreground">
              Gestisci le visite e lo storico clinico dei pazienti
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seleziona Paziente</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPaziente} onValueChange={setSelectedPaziente}>
                <SelectTrigger data-testid="select-paziente">
                  <SelectValue placeholder="Seleziona un paziente..." />
                </SelectTrigger>
                <SelectContent>
                  {pazienti.map((paziente) => (
                    <SelectItem key={paziente.id} value={paziente.id} data-testid={`select-item-${paziente.id}`}>
                      {paziente.cognome} {paziente.nome} - {paziente.codiceFiscale}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </>
      )}

      {/* Header Paziente Fisso */}
      {selectedPaziente && pazienteSelezionato && (
        <Card className="bg-card border-border" data-testid="card-header-paziente">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">
                        {pazienteSelezionato.cognome} {pazienteSelezionato.nome}
                      </h1>
                      <p className="text-muted-foreground font-mono text-sm mt-1">
                        CF: {pazienteSelezionato.codiceFiscale}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-foreground">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {eta} anni ({format(new Date(pazienteSelezionato.dataNascita), "d/MM/yyyy")})
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a 
                        href={`tel:${pazienteSelezionato.telefono}`}
                        className="text-sm text-primary hover:underline"
                        data-testid="link-telefono"
                      >
                        {pazienteSelezionato.telefono}
                      </a>
                    </div>

                    {pazienteSelezionato.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${pazienteSelezionato.email}`}
                          className="text-sm text-primary hover:underline"
                          data-testid="link-email"
                        >
                          {pazienteSelezionato.email}
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {visite.length} visite{giorniDaUltimaVisita && ` • ${giorniDaUltimaVisita}`}
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => setDialogOpen(true)}
                  data-testid="button-nuova-visita"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nuova Visita
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Box Allergie */}
      {selectedPaziente && pazienteSelezionato && pazienteSelezionato.allergie && pazienteSelezionato.allergie.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-5 rounded-lg" data-testid="alert-allergie">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100 text-lg mb-2">
                ⚠️ Attenzione - Allergie
              </h3>
              <ul className="space-y-1">
                {pazienteSelezionato.allergie.map((allergia, idx) => (
                  <li key={idx} className="text-red-800 dark:text-red-200 font-medium">
                    • {allergia}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Storico Visite */}
      {selectedPaziente && (
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Caricamento...</p>
            </Card>
          ) : isError ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-destructive/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Errore nel caricamento
                </h3>
                <p className="text-muted-foreground">
                  Impossibile caricare le visite. Riprova più tardi.
                </p>
              </div>
            </Card>
          ) : visite.length === 0 ? (
            <Card className="p-6">
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nessuna visita registrata
                </h3>
                <p className="text-muted-foreground mb-4">
                  Inizia registrando la prima visita per questo paziente
                </p>
                <Button onClick={() => setDialogOpen(true)} data-testid="button-prima-visita">
                  <Plus className="w-4 h-4 mr-2" />
                  Registra Prima Visita
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Storico Clinico ({visite.length} visite)
                </h2>
              </div>

              {visiteSortedCronologicamente.map((visita) => (
                <Card key={visita.id} className="hover-elevate active-elevate-2" data-testid={`card-visita-${visita.id}`}>
                  <CardContent className="p-6">
                    {/* Header Visita */}
                    <div className="flex items-start justify-between mb-4 pb-4 border-b">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1" data-testid={`text-data-${visita.id}`}>
                          📅 {format(new Date(visita.dataVisita), "d MMMM yyyy", { locale: it })}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {visita.motivoVisita}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVisita(visita);
                            setEditDialogOpen(true);
                          }}
                          data-testid={`button-edit-${visita.id}`}
                          className="gap-1"
                        >
                          <Pencil className="w-4 h-4" />
                          Modifica
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVisita(visita);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-${visita.id}`}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>

                    {/* Body - Sezioni Cliniche */}
                    <div className="space-y-4">
                      {/* Diagnosi - Highlighted */}
                      {visita.diagnosi && (
                        <div className="bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-600 p-4 rounded">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            Diagnosi
                          </p>
                          <p className="text-foreground font-medium leading-relaxed" data-testid={`text-diagnosi-${visita.id}`}>
                            {visita.diagnosi}
                          </p>
                        </div>
                      )}

                      {/* Terapia */}
                      {visita.terapia && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Pill className="w-4 h-4" />
                            Terapia
                          </p>
                          <p className="text-foreground leading-relaxed line-clamp-2" data-testid={`text-terapia-${visita.id}`}>
                            {visita.terapia}
                          </p>
                        </div>
                      )}

                      {/* Anamnesi */}
                      {visita.anamnesi && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Anamnesi
                          </p>
                          <p className="text-foreground leading-relaxed line-clamp-2" data-testid={`text-anamnesi-${visita.id}`}>
                            {visita.anamnesi}
                          </p>
                        </div>
                      )}

                      {/* Esame Obiettivo */}
                      {visita.esameObiettivo && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                            <Stethoscope className="w-4 h-4" />
                            Esame Obiettivo
                          </p>
                          <p className="text-foreground leading-relaxed line-clamp-2" data-testid={`text-esame-obiettivo-${visita.id}`}>
                            {visita.esameObiettivo}
                          </p>
                        </div>
                      )}

                      {/* Note Cliniche */}
                      {visita.noteCliniche && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Note Cliniche
                          </p>
                          <p className="text-foreground leading-relaxed line-clamp-2" data-testid={`text-note-${visita.id}`}>
                            {visita.noteCliniche}
                          </p>
                        </div>
                      )}

                      {/* Parametri Vitali */}
                      {(visita.peso || visita.altezza || visita.pressioneSistolica || visita.frequenzaCardiaca || visita.temperatura) && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {visita.peso && (
                            <Badge variant="outline" data-testid={`badge-peso-${visita.id}`}>
                              Peso: {visita.peso} kg
                            </Badge>
                          )}
                          {visita.altezza && (
                            <Badge variant="outline" data-testid={`badge-altezza-${visita.id}`}>
                              Alt: {visita.altezza} cm
                            </Badge>
                          )}
                          {visita.pressioneSistolica && visita.pressioneDiastolica && (
                            <Badge variant="outline" data-testid={`badge-pressione-${visita.id}`}>
                              PA: {visita.pressioneSistolica}/{visita.pressioneDiastolica}
                            </Badge>
                          )}
                          {visita.frequenzaCardiaca && (
                            <Badge variant="outline" data-testid={`badge-fc-${visita.id}`}>
                              FC: {visita.frequenzaCardiaca} bpm
                            </Badge>
                          )}
                          {visita.temperatura && (
                            <Badge variant="outline" data-testid={`badge-temperatura-${visita.id}`}>
                              T: {(visita.temperatura / 10).toFixed(1)}°C
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setTranscriptionText("");
          // Reset anche il campo note cliniche
          const noteField = document.getElementById('noteCliniche') as HTMLTextAreaElement;
          if (noteField) noteField.value = "";
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registra Nuova Visita</DialogTitle>
            <DialogDescription>
              Compila i dati della visita medica
            </DialogDescription>
          </DialogHeader>
          
          <VoiceRecorder 
            ambulatorioId={ambulatorioId}
            userId={userId}
            onTranscriptionComplete={handleTranscription}
            disabled={createMutation.isPending}
          />

          {transcriptionText && (
            <div className="space-y-3">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Label htmlFor="transcription" className="text-blue-900 dark:text-blue-100 font-semibold">
                          Trascrizione Audio
                        </Label>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Verificabile/Editabile
                      </Badge>
                    </div>
                    <Textarea
                      id="transcription"
                      value={transcriptionText}
                      onChange={(e) => setTranscriptionText(e.target.value)}
                      className="min-h-[120px] bg-white dark:bg-gray-950 font-mono text-sm"
                      placeholder="La trascrizione apparirà qui..."
                      data-testid="textarea-transcription"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const noteField = document.getElementById('noteCliniche') as HTMLTextAreaElement;
                        if (noteField) {
                          noteField.value = transcriptionText;
                          toast({
                            title: "Trascrizione copiata",
                            description: "La trascrizione è stata copiata nelle note cliniche",
                          });
                        }
                      }}
                      data-testid="button-copy-transcription"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia nelle Note Cliniche
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Warning: Verifica sempre la trascrizione */}
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Verifica obbligatoria:</strong> La trascrizione automatica può contenere errori. 
                  Leggi attentamente e correggi eventuali inesattezze prima di copiare nei campi della visita.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataVisita">Data Visita *</Label>
                  <Input
                    id="dataVisita"
                    name="dataVisita"
                    type="datetime-local"
                    required
                    data-testid="input-data-visita"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivoVisita">Motivo Visita *</Label>
                  <Input
                    id="motivoVisita"
                    name="motivoVisita"
                    placeholder="es. Controllo periodico"
                    required
                    data-testid="input-motivo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anamnesi">Anamnesi</Label>
                <Textarea
                  id="anamnesi"
                  name="anamnesi"
                  placeholder="Storia clinica e sintomi riferiti..."
                  rows={3}
                  data-testid="input-anamnesi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="esameObiettivo">Esame Obiettivo</Label>
                <Textarea
                  id="esameObiettivo"
                  name="esameObiettivo"
                  placeholder="Parametri vitali, osservazioni fisiche, esame clinico..."
                  rows={3}
                  data-testid="input-esame-obiettivo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="esamiEseguiti">Esami Strumentali / Laboratorio</Label>
                <Textarea
                  id="esamiEseguiti"
                  name="esamiEseguiti"
                  placeholder="Esami strumentali e di laboratorio eseguiti..."
                  rows={2}
                  data-testid="input-esami"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosi">Diagnosi *</Label>
                <Textarea
                  id="diagnosi"
                  name="diagnosi"
                  placeholder="Diagnosi clinica..."
                  required
                  rows={2}
                  data-testid="input-diagnosi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terapia">Terapia</Label>
                <Textarea
                  id="terapia"
                  name="terapia"
                  placeholder="Terapia consigliata..."
                  rows={2}
                  data-testid="input-terapia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescrizioneFarmaci">Prescrizione Farmaci</Label>
                <Textarea
                  id="prescrizioneFarmaci"
                  name="prescrizioneFarmaci"
                  placeholder="Farmaci prescritti con posologia..."
                  rows={2}
                  data-testid="input-prescrizioni"
                />
              </div>

              <div className="space-y-2">
                <Label>Parametri Vitali</Label>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
                    <Input
                      id="peso"
                      name="peso"
                      type="number"
                      placeholder="70"
                      data-testid="input-peso"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="altezza" className="text-xs">Altezza (cm)</Label>
                    <Input
                      id="altezza"
                      name="altezza"
                      type="number"
                      placeholder="175"
                      data-testid="input-altezza"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pressioneSistolica" className="text-xs">PA Sistolica</Label>
                    <Input
                      id="pressioneSistolica"
                      name="pressioneSistolica"
                      type="number"
                      placeholder="120"
                      data-testid="input-sistolica"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pressioneDiastolica" className="text-xs">PA Diastolica</Label>
                    <Input
                      id="pressioneDiastolica"
                      name="pressioneDiastolica"
                      type="number"
                      placeholder="80"
                      data-testid="input-diastolica"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequenzaCardiaca" className="text-xs">Freq. Cardiaca (bpm)</Label>
                    <Input
                      id="frequenzaCardiaca"
                      name="frequenzaCardiaca"
                      type="number"
                      placeholder="70"
                      data-testid="input-fc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperatura" className="text-xs">Temperatura (°C × 10)</Label>
                    <Input
                      id="temperatura"
                      name="temperatura"
                      type="number"
                      placeholder="365"
                      data-testid="input-temperatura"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="noteCliniche">Note Cliniche</Label>
                <Textarea
                  id="noteCliniche"
                  name="noteCliniche"
                  placeholder="Note aggiuntive..."
                  rows={2}
                  data-testid="input-note"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-create">
                Annulla
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !ambulatorioId} data-testid="button-salva-visita">
                {createMutation.isPending ? "Salvataggio..." : "Salva Visita"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) setEditTranscriptionText("");
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Visita</DialogTitle>
            <DialogDescription>
              Aggiorna i dati della visita medica
            </DialogDescription>
          </DialogHeader>
          
          <VoiceRecorder 
            ambulatorioId={ambulatorioId}
            userId={userId}
            onTranscriptionComplete={(result) => {
              const text = result.correctedText || result.text;
              setEditTranscriptionText(text);
            }}
            disabled={updateMutation.isPending}
          />

          {editTranscriptionText && (
            <div className="space-y-3">
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <Label htmlFor="edit-transcription" className="text-blue-900 dark:text-blue-100 font-semibold">
                          Trascrizione Audio
                        </Label>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Verificabile/Editabile
                      </Badge>
                    </div>
                    <Textarea
                      id="edit-transcription"
                      value={editTranscriptionText}
                      onChange={(e) => setEditTranscriptionText(e.target.value)}
                      className="min-h-[120px] bg-white dark:bg-gray-950 font-mono text-sm"
                      placeholder="La trascrizione apparirà qui..."
                      data-testid="textarea-edit-transcription"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const noteField = document.getElementById('edit-noteCliniche') as HTMLTextAreaElement;
                        if (noteField) {
                          noteField.value = editTranscriptionText;
                          toast({
                            title: "Trascrizione copiata",
                            description: "La trascrizione è stata copiata nelle note cliniche",
                          });
                        }
                      }}
                      data-testid="button-copy-edit-transcription"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia nelle Note Cliniche
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Verifica obbligatoria:</strong> La trascrizione automatica può contenere errori. 
                  Leggi attentamente e correggi eventuali inesattezze prima di copiare nei campi della visita.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {selectedVisita && (
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-dataVisita">Data Visita *</Label>
                    <Input
                      id="edit-dataVisita"
                      name="dataVisita"
                      type="datetime-local"
                      defaultValue={new Date(selectedVisita.dataVisita).toISOString().slice(0, 16)}
                      required
                      data-testid="input-edit-data"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-motivoVisita">Motivo Visita *</Label>
                    <Input
                      id="edit-motivoVisita"
                      name="motivoVisita"
                      defaultValue={selectedVisita.motivoVisita}
                      required
                      data-testid="input-edit-motivo"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-anamnesi">Anamnesi</Label>
                  <Textarea
                    id="edit-anamnesi"
                    name="anamnesi"
                    defaultValue={selectedVisita.anamnesi || ""}
                    rows={3}
                    data-testid="input-edit-anamnesi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-esameObiettivo">Esame Obiettivo</Label>
                  <Textarea
                    id="edit-esameObiettivo"
                    name="esameObiettivo"
                    defaultValue={selectedVisita.esameObiettivo || ""}
                    rows={3}
                    data-testid="input-edit-esame-obiettivo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-esamiEseguiti">Esami Strumentali / Laboratorio</Label>
                  <Textarea
                    id="edit-esamiEseguiti"
                    name="esamiEseguiti"
                    defaultValue={selectedVisita.esamiEseguiti || ""}
                    rows={2}
                    data-testid="input-edit-esami"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-diagnosi">Diagnosi *</Label>
                  <Textarea
                    id="edit-diagnosi"
                    name="diagnosi"
                    defaultValue={selectedVisita.diagnosi}
                    required
                    rows={2}
                    data-testid="input-edit-diagnosi"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-terapia">Terapia</Label>
                  <Textarea
                    id="edit-terapia"
                    name="terapia"
                    defaultValue={selectedVisita.terapia || ""}
                    rows={2}
                    data-testid="input-edit-terapia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-prescrizioneFarmaci">Prescrizione Farmaci</Label>
                  <Textarea
                    id="edit-prescrizioneFarmaci"
                    name="prescrizioneFarmaci"
                    defaultValue={selectedVisita.prescrizioneFarmaci || ""}
                    rows={2}
                    data-testid="input-edit-prescrizioni"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Parametri Vitali</Label>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-peso" className="text-xs">Peso (kg)</Label>
                      <Input
                        id="edit-peso"
                        name="peso"
                        type="number"
                        defaultValue={selectedVisita.peso || ""}
                        data-testid="input-edit-peso"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-altezza" className="text-xs">Altezza (cm)</Label>
                      <Input
                        id="edit-altezza"
                        name="altezza"
                        type="number"
                        defaultValue={selectedVisita.altezza || ""}
                        data-testid="input-edit-altezza"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-pressioneSistolica" className="text-xs">PA Sistolica</Label>
                      <Input
                        id="edit-pressioneSistolica"
                        name="pressioneSistolica"
                        type="number"
                        defaultValue={selectedVisita.pressioneSistolica || ""}
                        data-testid="input-edit-sistolica"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-pressioneDiastolica" className="text-xs">PA Diastolica</Label>
                      <Input
                        id="edit-pressioneDiastolica"
                        name="pressioneDiastolica"
                        type="number"
                        defaultValue={selectedVisita.pressioneDiastolica || ""}
                        data-testid="input-edit-diastolica"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-frequenzaCardiaca" className="text-xs">Freq. Cardiaca (bpm)</Label>
                      <Input
                        id="edit-frequenzaCardiaca"
                        name="frequenzaCardiaca"
                        type="number"
                        defaultValue={selectedVisita.frequenzaCardiaca || ""}
                        data-testid="input-edit-fc"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-temperatura" className="text-xs">Temperatura (°C × 10)</Label>
                      <Input
                        id="edit-temperatura"
                        name="temperatura"
                        type="number"
                        defaultValue={selectedVisita.temperatura || ""}
                        data-testid="input-edit-temperatura"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-noteCliniche">Note Cliniche</Label>
                  <Textarea
                    id="edit-noteCliniche"
                    name="noteCliniche"
                    defaultValue={selectedVisita.noteCliniche || ""}
                    rows={2}
                    data-testid="input-edit-note"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Annulla
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-aggiorna-visita">
                  {updateMutation.isPending ? "Aggiornamento..." : "Aggiorna Visita"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa visita? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedVisita && deleteMutation.mutate(selectedVisita.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
