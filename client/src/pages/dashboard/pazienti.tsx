import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Paziente } from "@shared/schema";

export default function Pazienti() {
  const { ambulatorioId } = useAmbulatorio();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: pazienti = [], isLoading } = useQuery<Paziente[]>({
    queryKey: ["/api/pazienti", ambulatorioId, searchQuery],
    queryFn: () => {
      const url = searchQuery
        ? `/api/pazienti?ambulatorioId=${ambulatorioId}&search=${searchQuery}`
        : `/api/pazienti?ambulatorioId=${ambulatorioId}`;
      return fetch(url).then(r => r.json());
    },
    enabled: !!ambulatorioId && ambulatorioId !== "default-ambulatorio-id",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/pazienti", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pazienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setDialogOpen(false);
      toast({
        title: "Paziente aggiunto",
        description: "Il paziente è stato registrato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il paziente",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/pazienti/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pazienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Paziente eliminato",
        description: "Il paziente è stato rimosso dal sistema",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      nome: formData.get("nome") as string,
      cognome: formData.get("cognome") as string,
      codiceFiscale: formData.get("codiceFiscale") as string,
      dataNascita: formData.get("dataNascita") as string,
      luogoNascita: formData.get("luogoNascita") as string,
      sesso: formData.get("sesso") as string,
      indirizzo: formData.get("indirizzo") as string,
      citta: formData.get("citta") as string,
      provincia: formData.get("provincia") as string,
      cap: formData.get("cap") as string,
      telefono: formData.get("telefono") as string,
      email: formData.get("email") as string || null,
      note: formData.get("note") as string || null,
      ambulatorioId,
    };

    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-pazienti-title">
            Pazienti
          </h1>
          <p className="text-muted-foreground">
            Gestisci l'anagrafica dei tuoi pazienti
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-patient">
              <Plus className="w-4 h-4" />
              Nuovo Paziente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuovo Paziente</DialogTitle>
              <DialogDescription>
                Inserisci i dati anagrafici del paziente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" name="nome" required data-testid="input-nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cognome">Cognome *</Label>
                  <Input id="cognome" name="cognome" required data-testid="input-cognome" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
                  <Input 
                    id="codiceFiscale" 
                    name="codiceFiscale" 
                    required 
                    maxLength={16}
                    className="uppercase"
                    data-testid="input-codice-fiscale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataNascita">Data di Nascita *</Label>
                  <Input id="dataNascita" name="dataNascita" type="date" required data-testid="input-data-nascita" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="luogoNascita">Luogo di Nascita *</Label>
                  <Input id="luogoNascita" name="luogoNascita" required data-testid="input-luogo-nascita" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sesso">Sesso *</Label>
                  <Select name="sesso" required>
                    <SelectTrigger data-testid="select-sesso">
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indirizzo">Indirizzo *</Label>
                <Input id="indirizzo" name="indirizzo" required data-testid="input-indirizzo" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="citta">Città *</Label>
                  <Input id="citta" name="citta" required data-testid="input-citta" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provincia">Provincia *</Label>
                  <Input id="provincia" name="provincia" required maxLength={2} className="uppercase" data-testid="input-provincia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cap">CAP *</Label>
                  <Input id="cap" name="cap" required maxLength={5} data-testid="input-cap" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input id="telefono" name="telefono" type="tel" required data-testid="input-telefono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" data-testid="input-email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Input id="note" name="note" data-testid="input-note" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-patient">
                  {createMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, cognome o codice fiscale..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-patients"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Caricamento...</p>
          </div>
        ) : pazienti.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchQuery ? "Nessun paziente trovato" : "Nessun paziente registrato"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "Prova con una ricerca diversa" : "Inizia aggiungendo il primo paziente al tuo ambulatorio"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setDialogOpen(true)} className="gap-2" data-testid="button-add-first-patient">
                <Plus className="w-4 h-4" />
                Aggiungi Paziente
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pazienti.map((paziente) => (
              <div 
                key={paziente.id} 
                className="flex items-center justify-between p-4 rounded-md border border-border hover-elevate active-elevate-2"
                data-testid={`card-patient-${paziente.id}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {paziente.nome[0]}{paziente.cognome[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-card-foreground">
                      {paziente.cognome} {paziente.nome}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      CF: {paziente.codiceFiscale} • Tel: {paziente.telefono}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" data-testid={`button-edit-${paziente.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm(`Eliminare il paziente ${paziente.nome} ${paziente.cognome}?`)) {
                        deleteMutation.mutate(paziente.id);
                      }
                    }}
                    data-testid={`button-delete-${paziente.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
