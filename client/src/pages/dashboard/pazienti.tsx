import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Search, Pencil, Trash2, Filter, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAmbulatorio } from "@/lib/useAmbulatorio";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Paziente } from "@shared/schema";

type PazienteEnriched = Paziente & {
  eta?: number;
  status?: 'attivo' | 'recente' | 'inattivo';
  isNuovo?: boolean;
  ultimaVisita?: string | null;
};

export default function Pazienti() {
  const { ambulatorioId } = useAmbulatorio();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    sesso: "",
    citta: "",
    provincia: "",
    etaMin: "",
    etaMax: "",
  });
  const [sortBy, setSortBy] = useState<'cognome' | 'dataNascita' | 'citta'>('cognome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPaziente, setSelectedPaziente] = useState<Paziente | null>(null);
  const { toast } = useToast();

  // Debounce per search query
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data, isLoading } = useQuery<{ 
    pazienti: PazienteEnriched[], 
    pagination: { page: number, limit: number, total: number, totalPages: number } 
  }>({
    queryKey: ["/api/pazienti", ambulatorioId, debouncedSearch, filters, currentPage],
    queryFn: () => {
      const params = new URLSearchParams({ 
        ambulatorioId,
        page: currentPage.toString(),
        limit: '20'
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (filters.sesso) params.append('sesso', filters.sesso);
      if (filters.citta) params.append('citta', filters.citta);
      if (filters.provincia) params.append('provincia', filters.provincia);
      if (filters.etaMin) params.append('etaMin', filters.etaMin);
      if (filters.etaMax) params.append('etaMax', filters.etaMax);
      
      return fetch(`/api/pazienti?${params.toString()}`).then(r => r.json());
    },
    enabled: !!ambulatorioId,
  });

  const pazientiData = data?.pazienti || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  // Funzione Export CSV
  const handleExportCSV = () => {
    const url = `/api/pazienti/export/csv?ambulatorioId=${ambulatorioId}`;
    window.open(url, '_blank');
    toast({
      title: "Export CSV",
      description: "Il download del file CSV è iniziato",
    });
  };

  // Sorting pazienti lato client
  const pazienti = useMemo(() => {
    if (!pazientiData) return [];
    
    const sorted = [...pazientiData].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'cognome':
          aVal = `${a.cognome} ${a.nome}`.toLowerCase();
          bVal = `${b.cognome} ${b.nome}`.toLowerCase();
          break;
        case 'dataNascita':
          aVal = new Date(a.dataNascita).getTime();
          bVal = new Date(b.dataNascita).getTime();
          break;
        case 'citta':
          aVal = a.citta.toLowerCase();
          bVal = b.citta.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
    
    return sorted;
  }, [pazientiData, sortBy, sortOrder]);

  // Badge Status
  const getStatusBadge = (status?: 'attivo' | 'recente' | 'inattivo') => {
    if (!status) return null;
    
    const variants = {
      attivo: { variant: 'default' as const, label: 'Attivo' },
      recente: { variant: 'secondary' as const, label: 'Recente' },
      inattivo: { variant: 'outline' as const, label: 'Inattivo' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  // Reset page quando cambiano filtri o search
  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/pazienti", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pazienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/pazienti/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pazienti"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditDialogOpen(false);
      setSelectedPaziente(null);
      toast({
        title: "Paziente aggiornato",
        description: "I dati del paziente sono stati modificati con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il paziente",
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

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPaziente) return;
    
    const formData = new FormData(e.currentTarget);
    
    // Parse allergie string to array
    const allergieString = formData.get("allergie") as string;
    const allergieArray = allergieString 
      ? allergieString.split(',').map(a => a.trim()).filter(a => a.length > 0)
      : [];
    
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
      allergie: allergieArray.length > 0 ? allergieArray : null,
    };

    updateMutation.mutate({ id: selectedPaziente.id, data });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2" data-testid="text-pazienti-title">
            Pazienti
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {pagination.total} pazienti totali
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            className="gap-2 flex-1 sm:flex-initial"
            data-testid="button-export-csv"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 flex-1 sm:flex-initial" data-testid="button-add-patient">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuovo Paziente</span>
                <span className="sm:hidden">Nuovo</span>
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
                  <select name="sesso" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" data-testid="select-sesso">
                    <option value="">Seleziona...</option>
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
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
                <Button type="submit" disabled={createMutation.isPending || !ambulatorioId} data-testid="button-save-patient">
                  {createMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifica Paziente</DialogTitle>
            <DialogDescription>
              Modifica i dati anagrafici del paziente
            </DialogDescription>
          </DialogHeader>
          {selectedPaziente && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome *</Label>
                  <Input id="edit-nome" name="nome" required defaultValue={selectedPaziente.nome} data-testid="input-edit-nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cognome">Cognome *</Label>
                  <Input id="edit-cognome" name="cognome" required defaultValue={selectedPaziente.cognome} data-testid="input-edit-cognome" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-codiceFiscale">Codice Fiscale *</Label>
                  <Input 
                    id="edit-codiceFiscale" 
                    name="codiceFiscale" 
                    required 
                    maxLength={16}
                    className="uppercase"
                    defaultValue={selectedPaziente.codiceFiscale}
                    data-testid="input-edit-codice-fiscale"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataNascita">Data di Nascita *</Label>
                  <Input 
                    id="edit-dataNascita" 
                    name="dataNascita" 
                    type="date" 
                    required 
                    defaultValue={new Date(selectedPaziente.dataNascita).toISOString().split('T')[0]}
                    data-testid="input-edit-data-nascita" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-luogoNascita">Luogo di Nascita *</Label>
                  <Input id="edit-luogoNascita" name="luogoNascita" required defaultValue={selectedPaziente.luogoNascita} data-testid="input-edit-luogo-nascita" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sesso">Sesso *</Label>
                  <select name="sesso" required defaultValue={selectedPaziente.sesso} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" data-testid="select-edit-sesso">
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-indirizzo">Indirizzo *</Label>
                <Input id="edit-indirizzo" name="indirizzo" required defaultValue={selectedPaziente.indirizzo} data-testid="input-edit-indirizzo" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-citta">Città *</Label>
                  <Input id="edit-citta" name="citta" required defaultValue={selectedPaziente.citta} data-testid="input-edit-citta" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-provincia">Provincia *</Label>
                  <Input id="edit-provincia" name="provincia" required maxLength={2} className="uppercase" defaultValue={selectedPaziente.provincia} data-testid="input-edit-provincia" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cap">CAP *</Label>
                  <Input id="edit-cap" name="cap" required maxLength={5} defaultValue={selectedPaziente.cap} data-testid="input-edit-cap" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-telefono">Telefono *</Label>
                  <Input id="edit-telefono" name="telefono" type="tel" required defaultValue={selectedPaziente.telefono} data-testid="input-edit-telefono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedPaziente.email || ''} data-testid="input-edit-email" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-note">Note</Label>
                <Input id="edit-note" name="note" defaultValue={selectedPaziente.note || ''} data-testid="input-edit-note" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-allergie" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Allergie (separate da virgola)
                </Label>
                <Textarea 
                  id="edit-allergie" 
                  name="allergie" 
                  placeholder="es. Penicillina, Lattosio, Polen" 
                  defaultValue={selectedPaziente.allergie?.join(', ') || ''}
                  rows={2}
                  data-testid="input-edit-allergie"
                  className="font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  ⚠️ Le allergie verranno mostrate in evidenza nella cartella clinica
                </p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-edit">
                  Annulla
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-edit-patient">
                  {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-6 bg-linear-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            AI Agent Search
          </h2>
          <AutocompleteSearch pazienti={pazienti} />
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">Suggerimento:</span> Prova con typo come "Maro" (trova Mario), "333" (telefono), "MI" (Milano)
          </p>
        </div>
      </Card>

      <Card className="p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cerca paziente..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                data-testid="input-search-patients"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 flex-1 sm:flex-initial"
                data-testid="button-toggle-filters"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">{showFilters ? 'Nascondi' : 'Filtri'}</span>
                <span className="sm:hidden">Filtri</span>
              </Button>
              {(filters.sesso || filters.citta || filters.provincia || filters.etaMin || filters.etaMax) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFiltersChange({ sesso: "", citta: "", provincia: "", etaMin: "", etaMax: "" })}
                  className="gap-1 sm:gap-2"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Azzera</span>
                </Button>
              )}
            </div>
          </div>

          <Collapsible open={showFilters}>
            <CollapsibleContent className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Sesso</Label>
                  <Select
                    value={filters.sesso || undefined}
                    onValueChange={(value) => handleFiltersChange({ ...filters, sesso: value || "" })}
                  >
                    <SelectTrigger data-testid="select-filter-sesso">
                      <SelectValue placeholder="Tutti" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschio</SelectItem>
                      <SelectItem value="F">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Città</Label>
                  <Input
                    placeholder="Es: Milano"
                    value={filters.citta}
                    onChange={(e) => handleFiltersChange({ ...filters, citta: e.target.value })}
                    data-testid="input-filter-citta"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input
                    placeholder="Es: MI"
                    maxLength={2}
                    className="uppercase"
                    value={filters.provincia}
                    onChange={(e) => handleFiltersChange({ ...filters, provincia: e.target.value.toUpperCase() })}
                    data-testid="input-filter-provincia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Età Min</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Es: 18"
                    value={filters.etaMin}
                    onChange={(e) => handleFiltersChange({ ...filters, etaMin: e.target.value })}
                    data-testid="input-filter-eta-min"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Età Max</Label>
                  <Input
                    type="number"
                    min="0"
                    max="120"
                    placeholder="Es: 65"
                    value={filters.etaMax}
                    onChange={(e) => handleFiltersChange({ ...filters, etaMax: e.target.value })}
                    data-testid="input-filter-eta-max"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Barra ordinamento */}
        {pazienti.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-3 sm:pb-4 border-b">
            <span className="text-xs sm:text-sm text-muted-foreground">Ordina per:</span>
            <div className="flex gap-1.5 flex-wrap">
              <Button
                variant={sortBy === 'cognome' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (sortBy === 'cognome') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('cognome');
                    setSortOrder('asc');
                  }
                }}
                className="gap-1 text-xs sm:text-sm"
                data-testid="button-sort-cognome"
              >
                Nome
                {sortBy === 'cognome' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'dataNascita' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (sortBy === 'dataNascita') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('dataNascita');
                    setSortOrder('asc');
                  }
                }}
                className="gap-1 text-xs sm:text-sm"
                data-testid="button-sort-data"
              >
                <span className="hidden sm:inline">Data Nascita</span>
                <span className="sm:hidden">Data</span>
                {sortBy === 'dataNascita' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant={sortBy === 'citta' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  if (sortBy === 'citta') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('citta');
                    setSortOrder('asc');
                  }
                }}
                className="gap-1 text-xs sm:text-sm"
                data-testid="button-sort-citta"
              >
                Città
                {sortBy === 'citta' && (
                  sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}

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
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-md border border-border hover-elevate active-elevate-2 gap-3"
                data-testid={`card-patient-${paziente.id}`}
              >
                <Link href={`/dashboard/pazienti/${paziente.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {paziente.nome[0]}{paziente.cognome[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <p className="font-semibold text-card-foreground hover:text-primary transition-colors">
                        {paziente.cognome} {paziente.nome}
                      </p>
                      {paziente.isNuovo && (
                        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">Nuovo</Badge>
                      )}
                      {paziente.status && getStatusBadge(paziente.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {paziente.eta && `${paziente.eta} anni • `}
                      CF: {paziente.codiceFiscale}
                    </p>
                    <p className="text-xs text-muted-foreground truncate sm:hidden">
                      Tel: {paziente.telefono}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {isMobile ? (
                    /* Mobile: solo PDF e Edit */
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          window.open(`/api/pazienti/${paziente.id}/cartella-pdf`, '_blank');
                        }}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        data-testid={`button-pdf-${paziente.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedPaziente(paziente);
                          setEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-${paziente.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    /* Desktop: tutti i button */
                    <>
                      <Link href={`/dashboard/cartella-clinica?pazienteId=${paziente.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          data-testid={`button-cartella-${paziente.id}`}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          window.open(`/api/pazienti/${paziente.id}/cartella-pdf`, '_blank');
                        }}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                        data-testid={`button-pdf-${paziente.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedPaziente(paziente);
                          setEditDialogOpen(true);
                        }}
                        data-testid={`button-edit-${paziente.id}`}
                      >
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginazione */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Pagina {pagination.page} di {pagination.totalPages} ({pagination.total} pazienti)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.page === 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
                Precedente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.page === pagination.totalPages}
                data-testid="button-next-page"
              >
                Successiva
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
