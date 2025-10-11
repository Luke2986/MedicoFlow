import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Clock, User, Pencil, Trash2, List } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Appuntamento, Paziente } from "@shared/schema";

export default function Appuntamenti() {
  const { ambulatorioId } = useAmbulatorio();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAppuntamento, setSelectedAppuntamento] = useState<Appuntamento | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [preselectedDate, setPreselectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const { data: appuntamenti = [], isLoading } = useQuery<Appuntamento[]>({
    queryKey: ["/api/appuntamenti", ambulatorioId],
    queryFn: () => fetch(`/api/appuntamenti?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const { data: pazienti = [] } = useQuery<Paziente[]>({
    queryKey: ["/api/pazienti", ambulatorioId],
    queryFn: () => fetch(`/api/pazienti?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/appuntamenti", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appuntamenti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      toast({
        title: "Appuntamento creato",
        description: "L'appuntamento è stato aggiunto al calendario",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/appuntamenti/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appuntamenti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditDialogOpen(false);
      setSelectedAppuntamento(null);
      toast({
        title: "Appuntamento aggiornato",
        description: "L'appuntamento è stato modificato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/appuntamenti/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appuntamenti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Appuntamento eliminato",
        description: "L'appuntamento è stato rimosso dal calendario",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      pazienteId: formData.get("pazienteId") as string,
      dataOra: new Date(formData.get("data") as string + "T" + formData.get("ora") as string).toISOString(),
      durata: parseInt(formData.get("durata") as string),
      tipo: formData.get("tipo") as string,
      stato: "confermato",
      motivoVisita: formData.get("motivoVisita") as string || null,
      note: formData.get("note") as string || null,
      ambulatorioId,
    };

    createMutation.mutate(data);
  };

  const handleCreateFromCalendar = (date: Date) => {
    setPreselectedDate(date);
    setDialogOpen(true);
  };

  const handleEditFromCalendar = (app: Appuntamento) => {
    setSelectedAppuntamento(app);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    if (!dialogOpen) {
      setPreselectedDate(null);
    }
  }, [dialogOpen]);

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAppuntamento) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data = {
      pazienteId: formData.get("pazienteId") as string,
      dataOra: new Date(formData.get("data") as string + "T" + formData.get("ora") as string).toISOString(),
      durata: parseInt(formData.get("durata") as string),
      tipo: formData.get("tipo") as string,
      stato: formData.get("stato") as string,
      motivoVisita: formData.get("motivoVisita") as string || null,
      note: formData.get("note") as string || null,
    };

    updateMutation.mutate({ id: selectedAppuntamento.id, data });
  };

  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'confermato':
        return 'bg-chart-2/10 text-chart-2';
      case 'in_attesa':
        return 'bg-chart-3/10 text-chart-3';
      case 'cancellato':
        return 'bg-chart-4/10 text-chart-4';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-appuntamenti-title">
            Appuntamenti
          </h1>
          <p className="text-muted-foreground">
            Gestisci il calendario degli appuntamenti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-l-none"
              data-testid="button-view-calendar"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
            </Button>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={pazienti.length === 0} data-testid="button-add-appointment">
                <Plus className="w-4 h-4" />
                Nuovo Appuntamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crea Nuovo Appuntamento</DialogTitle>
                <DialogDescription>
                  Pianifica un appuntamento per un paziente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pazienteId">Paziente *</Label>
                  <Select name="pazienteId" required>
                    <SelectTrigger data-testid="select-patient">
                      <SelectValue placeholder="Seleziona paziente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pazienti.map((paz) => (
                        <SelectItem key={paz.id} value={paz.id}>
                          {paz.cognome} {paz.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="data">Data *</Label>
                    <Input 
                      id="data" 
                      name="data" 
                      type="date" 
                      required 
                      defaultValue={preselectedDate ? preselectedDate.toISOString().split('T')[0] : undefined}
                      data-testid="input-date" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ora">Ora *</Label>
                    <Input id="ora" name="ora" type="time" required data-testid="input-time" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo Visita *</Label>
                    <Select name="tipo" required>
                      <SelectTrigger data-testid="select-type">
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Prima visita">Prima visita</SelectItem>
                        <SelectItem value="Controllo">Controllo</SelectItem>
                        <SelectItem value="Urgente">Urgente</SelectItem>
                        <SelectItem value="Esame">Esame</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="durata">Durata (min) *</Label>
                    <Select name="durata" defaultValue="30">
                      <SelectTrigger data-testid="select-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minuti</SelectItem>
                        <SelectItem value="30">30 minuti</SelectItem>
                        <SelectItem value="45">45 minuti</SelectItem>
                        <SelectItem value="60">60 minuti</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivoVisita">Motivo della Visita</Label>
                  <Input id="motivoVisita" name="motivoVisita" data-testid="input-reason" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Input id="note" name="note" data-testid="input-notes" />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-appointment">
                    {createMutation.isPending ? "Creazione..." : "Crea"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifica Appuntamento</DialogTitle>
            <DialogDescription>
              Modifica i dettagli dell'appuntamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppuntamento && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pazienteId">Paziente *</Label>
                <Select name="pazienteId" required defaultValue={selectedAppuntamento.pazienteId}>
                  <SelectTrigger data-testid="select-edit-patient">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pazienti.map((paz) => (
                      <SelectItem key={paz.id} value={paz.id}>
                        {paz.cognome} {paz.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-data">Data *</Label>
                  <Input 
                    id="edit-data" 
                    name="data" 
                    type="date" 
                    required 
                    defaultValue={new Date(selectedAppuntamento.dataOra).toISOString().split('T')[0]}
                    data-testid="input-edit-date" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ora">Ora *</Label>
                  <Input 
                    id="edit-ora" 
                    name="ora" 
                    type="time" 
                    required 
                    defaultValue={new Date(selectedAppuntamento.dataOra).toTimeString().slice(0, 5)}
                    data-testid="input-edit-time" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo Visita *</Label>
                  <Select name="tipo" required defaultValue={selectedAppuntamento.tipo}>
                    <SelectTrigger data-testid="select-edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prima visita">Prima visita</SelectItem>
                      <SelectItem value="Controllo">Controllo</SelectItem>
                      <SelectItem value="Urgente">Urgente</SelectItem>
                      <SelectItem value="Esame">Esame</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-durata">Durata (min) *</Label>
                  <Select name="durata" defaultValue={selectedAppuntamento.durata.toString()}>
                    <SelectTrigger data-testid="select-edit-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minuti</SelectItem>
                      <SelectItem value="30">30 minuti</SelectItem>
                      <SelectItem value="45">45 minuti</SelectItem>
                      <SelectItem value="60">60 minuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-stato">Stato *</Label>
                <Select name="stato" required defaultValue={selectedAppuntamento.stato}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confermato">Confermato</SelectItem>
                    <SelectItem value="in_attesa">In Attesa</SelectItem>
                    <SelectItem value="cancellato">Cancellato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-motivoVisita">Motivo della Visita</Label>
                <Input id="edit-motivoVisita" name="motivoVisita" defaultValue={selectedAppuntamento.motivoVisita || ''} data-testid="input-edit-reason" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Input id="edit-note" name="note" defaultValue={selectedAppuntamento.note || ''} data-testid="input-edit-notes" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Annulla
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-appointment">
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {viewMode === 'calendar' ? (
        pazienti.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-16">
              <User className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nessun paziente disponibile
              </h3>
              <p className="text-muted-foreground">
                Prima di creare appuntamenti, aggiungi almeno un paziente
              </p>
            </div>
          </Card>
        ) : (
          <CalendarView
            appuntamenti={appuntamenti}
            pazienti={pazienti}
            onEditAppointment={handleEditFromCalendar}
            onCreateAppointment={handleCreateFromCalendar}
          />
        )
      ) : (
        <Card className="p-6">
          {pazienti.length === 0 ? (
            <div className="text-center py-16">
              <User className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nessun paziente disponibile
              </h3>
              <p className="text-muted-foreground">
                Prima di creare appuntamenti, aggiungi almeno un paziente
              </p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          ) : appuntamenti.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nessun appuntamento programmato
              </h3>
              <p className="text-muted-foreground mb-6">
                Il calendario è vuoto. Inizia aggiungendo il primo appuntamento
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-first-appointment">
                <Plus className="w-4 h-4" />
                Crea Appuntamento
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {appuntamenti.map((app) => {
                const paziente = pazienti.find(p => p.id === app.pazienteId);
                return (
                  <div 
                    key={app.id} 
                    className="flex items-center justify-between p-4 rounded-md border border-border hover-elevate active-elevate-2"
                    data-testid={`card-appointment-${app.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-card-foreground">
                          {paziente ? `${paziente.cognome} ${paziente.nome}` : "Paziente sconosciuto"}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(app.dataOra).toLocaleString('it-IT', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span>•</span>
                          <span>{app.tipo}</span>
                          <span>•</span>
                          <span>{app.durata} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(app.stato)}`}>
                        {app.stato}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setSelectedAppuntamento(app);
                          setEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-${app.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          if (confirm(`Eliminare questo appuntamento?`)) {
                            deleteMutation.mutate(app.id);
                          }
                        }}
                        data-testid={`button-delete-${app.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
