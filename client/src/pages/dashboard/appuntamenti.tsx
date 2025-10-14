import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, List, User } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import WeekCalendar from "@/components/WeekCalendar";
import AppointmentModal from "@/components/AppointmentModal";
import { useToast } from "@/hooks/use-toast";
import type { Appuntamento, Paziente } from "@shared/schema";

export default function Appuntamenti() {
  const { ambulatorioId } = useAmbulatorio();
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAppuntamento, setSelectedAppuntamento] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const { toast } = useToast();

  const { data: appuntamenti = [], isLoading } = useQuery<Appuntamento[]>({
    queryKey: ["/api/appuntamenti", ambulatorioId, currentWeekDate.toISOString()],
    queryFn: () => fetch(`/api/appuntamenti?ambulatorioId=${ambulatorioId}&date=${currentWeekDate.toISOString()}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const { data: pazienti = [] } = useQuery<Paziente[]>({
    queryKey: ["/api/pazienti", ambulatorioId],
    queryFn: () => fetch(`/api/pazienti?ambulatorioId=${ambulatorioId}`).then(r => r.json()),
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const handleAppuntamentoClick = (appuntamento: any) => {
    setSelectedAppuntamento(appuntamento);
    setSelectedSlot(null);
    setModalOpen(true);
  };

  const handleSlotClick = (date: Date, hour: number, minutes: number) => {
    setSelectedSlot({ date, hour, minutes });
    setSelectedAppuntamento(null);
    setModalOpen(true);
  };

  const handleWeekChange = (date: Date) => {
    setCurrentWeekDate(date);
  };

  const handleSave = async (data: any) => {
    try {
      const url = data.id ? `/api/appuntamenti/${data.id}` : '/api/appuntamenti';
      const method = data.id ? 'PATCH' : 'POST';

      const payload = {
        pazienteId: data.pazienteId,
        dataOra: data.dataOra,
        durata: data.durata,
        tipo: data.tipo,
        motivoVisita: data.motivoVisita,
        note: data.note,
        ambulatorioId,
        ...(data.id && { stato: data.stato })
      };

      const response = await apiRequest(method, url, payload);
      
      if (response.error === 'Conflitto: esiste già un appuntamento in questo orario') {
        toast({
          title: "Conflitto rilevato",
          description: "Esiste già un appuntamento in questo orario",
          variant: "destructive",
        });
        throw new Error('Conflitto');
      }

      queryClient.invalidateQueries({ queryKey: ["/api/appuntamenti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setModalOpen(false);
      setSelectedAppuntamento(null);
      setSelectedSlot(null);
      
      toast({
        title: data.id ? "Appuntamento aggiornato" : "Appuntamento creato",
        description: data.id ? "L'appuntamento è stato modificato con successo" : "L'appuntamento è stato aggiunto al calendario",
      });
    } catch (error: any) {
      if (error.message !== 'Conflitto') {
        toast({
          title: "Errore",
          description: error.message || "Impossibile salvare l'appuntamento",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/appuntamenti/${id}`, undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/appuntamenti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setModalOpen(false);
      setSelectedAppuntamento(null);
      
      toast({
        title: "Appuntamento eliminato",
        description: "L'appuntamento è stato rimosso dal calendario",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare l'appuntamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-appuntamenti-title">
            Calendario Appuntamenti
          </h1>
          <p className="text-muted-foreground">
            Gestisci gli appuntamenti settimanali
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-r-none"
              data-testid="button-view-week"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Settimana
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>
          <Button 
            className="gap-2" 
            disabled={pazienti.length === 0}
            onClick={() => {
              setSelectedAppuntamento(null);
              setSelectedSlot({ date: new Date(), hour: 9, minutes: 0 });
              setModalOpen(true);
            }}
            data-testid="button-add-appointment"
          >
            <Plus className="w-4 h-4" />
            Nuovo Appuntamento
          </Button>
        </div>
      </div>

      {pazienti.length === 0 ? (
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
      ) : viewMode === 'week' ? (
        isLoading ? (
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Caricamento calendario...</p>
            </div>
          </Card>
        ) : (
          <>
            <WeekCalendar
              appuntamenti={appuntamenti}
              currentDate={currentWeekDate}
              onAppuntamentoClick={handleAppuntamentoClick}
              onSlotClick={handleSlotClick}
              onWeekChange={handleWeekChange}
            />
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-2">💡 Suggerimenti</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clicca su uno slot vuoto per creare un nuovo appuntamento</li>
                <li>• Clicca su un appuntamento esistente per modificarlo o eliminarlo</li>
                <li>• Usa i pulsanti freccia per navigare tra le settimane</li>
                <li>• Il sistema previene automaticamente i conflitti di orario</li>
              </ul>
            </div>
          </>
        )
      ) : (
        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Caricamento...</p>
            </div>
          ) : appuntamenti.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nessun appuntamento questa settimana
              </h3>
              <p className="text-muted-foreground mb-6">
                Il calendario è vuoto. Inizia aggiungendo il primo appuntamento
              </p>
              <Button 
                onClick={() => {
                  setSelectedAppuntamento(null);
                  setSelectedSlot({ date: new Date(), hour: 9, minutes: 0 });
                  setModalOpen(true);
                }}
                className="gap-2" 
                data-testid="button-add-first-appointment"
              >
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
                    className="flex items-center justify-between p-4 rounded-md border border-border hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => handleAppuntamentoClick(app)}
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
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                          <span>
                            {new Date(app.dataOra).toLocaleString('it-IT', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          <span>•</span>
                          <span>{app.tipo}</span>
                          <span>•</span>
                          <span>{app.durata} min</span>
                          {app.motivoVisita && (
                            <>
                              <span>•</span>
                              <span className="truncate">{app.motivoVisita}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAppuntamento(null);
          setSelectedSlot(null);
        }}
        appuntamento={selectedAppuntamento}
        defaultDate={selectedSlot?.date}
        defaultTime={selectedSlot ? { hour: selectedSlot.hour, minutes: selectedSlot.minutes } : undefined}
        pazienti={pazienti}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
