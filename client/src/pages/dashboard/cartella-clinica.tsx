import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Calendar as CalendarIcon, User, Activity, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
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
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Visita, Paziente } from "@shared/schema";

export default function CartellaClinica() {
  const { ambulatorioId } = useAmbulatorio();
  const [selectedPaziente, setSelectedPaziente] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const { toast } = useToast();

  const { data: pazienti = [] } = useQuery<Paziente[]>({
    queryKey: ["/api/pazienti", ambulatorioId],
    queryFn: () => fetch(`/api/pazienti?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      pazienteId: selectedPaziente,
      dataVisita: new Date(formData.get("dataVisita") as string).toISOString(),
      motivoVisita: formData.get("motivoVisita") as string,
      anamnesi: formData.get("anamnesi") as string || null,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-cartella-title">
            Cartella Clinica
          </h1>
          <p className="text-muted-foreground">
            Gestisci le visite e lo storico clinico dei pazienti
          </p>
        </div>
        {selectedPaziente && (
          <Button 
            onClick={() => setDialogOpen(true)}
            data-testid="button-nuova-visita"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Visita
          </Button>
        )}
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

      {selectedPaziente && pazienteSelezionato && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                {pazienteSelezionato.cognome} {pazienteSelezionato.nome}
              </CardTitle>
              <Badge variant="outline" data-testid={`badge-visite-count`}>
                {visite.length} {visite.length === 1 ? 'visita' : 'visite'}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

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
              <h2 className="text-xl font-semibold text-foreground">Storico Visite (Cronologico)</h2>
              {visiteSortedCronologicamente.map((visita) => (
                <Card key={visita.id} className="hover-elevate" data-testid={`card-visita-${visita.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-foreground" data-testid={`text-data-${visita.id}`}>
                            {format(new Date(visita.dataVisita), "d MMMM yyyy", { locale: it })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {visita.motivoVisita}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVisita(visita);
                            setEditDialogOpen(true);
                          }}
                          data-testid={`button-edit-${visita.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedVisita(visita);
                            setDeleteDialogOpen(true);
                          }}
                          data-testid={`button-delete-${visita.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {visita.anamnesi && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Anamnesi</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-anamnesi-${visita.id}`}>
                            {visita.anamnesi}
                          </p>
                        </div>
                      )}

                      {visita.esamiEseguiti && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Esami Eseguiti</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-esami-${visita.id}`}>
                            {visita.esamiEseguiti}
                          </p>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Diagnosi</h4>
                        <p className="text-sm text-muted-foreground" data-testid={`text-diagnosi-${visita.id}`}>
                          {visita.diagnosi}
                        </p>
                      </div>

                      {visita.terapia && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Terapia</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-terapia-${visita.id}`}>
                            {visita.terapia}
                          </p>
                        </div>
                      )}

                      {visita.prescrizioneFarmaci && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Prescrizioni</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-prescrizioni-${visita.id}`}>
                            {visita.prescrizioneFarmaci}
                          </p>
                        </div>
                      )}

                      {visita.noteCliniche && (
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">Note Cliniche</h4>
                          <p className="text-sm text-muted-foreground" data-testid={`text-note-${visita.id}`}>
                            {visita.noteCliniche}
                          </p>
                        </div>
                      )}

                      {(visita.peso || visita.altezza || visita.pressioneSistolica || visita.frequenzaCardiaca || visita.temperatura) && (
                        <div className="flex items-center gap-6 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">Parametri Vitali:</span>
                          </div>
                          {visita.peso && (
                            <Badge variant="outline" data-testid={`badge-peso-${visita.id}`}>
                              Peso: {visita.peso} kg
                            </Badge>
                          )}
                          {visita.altezza && (
                            <Badge variant="outline" data-testid={`badge-altezza-${visita.id}`}>
                              Altezza: {visita.altezza} cm
                            </Badge>
                          )}
                          {visita.pressioneSistolica && visita.pressioneDiastolica && (
                            <Badge variant="outline" data-testid={`badge-pressione-${visita.id}`}>
                              PA: {visita.pressioneSistolica}/{visita.pressioneDiastolica} mmHg
                            </Badge>
                          )}
                          {visita.frequenzaCardiaca && (
                            <Badge variant="outline" data-testid={`badge-fc-${visita.id}`}>
                              FC: {visita.frequenzaCardiaca} bpm
                            </Badge>
                          )}
                          {visita.temperatura && (
                            <Badge variant="outline" data-testid={`badge-temperatura-${visita.id}`}>
                              T: {(visita.temperatura / 10).toFixed(1)} °C
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registra Nuova Visita</DialogTitle>
            <DialogDescription>
              Compila i dati della visita medica
            </DialogDescription>
          </DialogHeader>
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
                <Label htmlFor="esamiEseguiti">Esami Eseguiti</Label>
                <Textarea
                  id="esamiEseguiti"
                  name="esamiEseguiti"
                  placeholder="Esami obiettivi e strumentali..."
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
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-salva-visita">
                {createMutation.isPending ? "Salvataggio..." : "Salva Visita"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Visita</DialogTitle>
            <DialogDescription>
              Aggiorna i dati della visita medica
            </DialogDescription>
          </DialogHeader>
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
                  <Label htmlFor="edit-esamiEseguiti">Esami Eseguiti</Label>
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
