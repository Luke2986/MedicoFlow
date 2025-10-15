import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { ArrowLeft, Save, Loader2, Building2, MapPin, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Ambulatorio } from "@shared/schema";
import { useState, useEffect } from "react";

// Hardcoded ambulatorio ID (no auth system)
const AMBULATORIO_ID = "9f6d275b-f296-495b-b80c-907404f09a15";

export default function AmbulatorioPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: "",
    indirizzo: "",
    citta: "",
    provincia: "",
    cap: "",
    telefono: "",
    email: "",
    piva: "",
    regione: "",
    specializzazione: "",
    specializationId: ""
  });

  const { data: ambulatorio, isLoading } = useQuery<Ambulatorio>({
    queryKey: ["/api/ambulatori", AMBULATORIO_ID],
    queryFn: async () => {
      const res = await fetch(`/api/ambulatori/${AMBULATORIO_ID}`);
      if (!res.ok) throw new Error("Errore caricamento ambulatorio");
      return res.json();
    }
  });

  const { data: specializations = [], isLoading: loadingSpecs } = useQuery<any[]>({
    queryKey: ["/api/specializations"],
    queryFn: async () => {
      const res = await fetch("/api/specializations");
      if (!res.ok) throw new Error("Errore caricamento specializzazioni");
      return res.json();
    }
  });

  // Populate form with ambulatorio data
  useEffect(() => {
    if (ambulatorio) {
      setFormData({
        nome: ambulatorio.nome,
        indirizzo: ambulatorio.indirizzo,
        citta: ambulatorio.citta,
        provincia: ambulatorio.provincia,
        cap: ambulatorio.cap,
        telefono: ambulatorio.telefono,
        email: ambulatorio.email,
        piva: ambulatorio.piva,
        regione: ambulatorio.regione,
        specializzazione: ambulatorio.specializzazione,
        specializationId: ambulatorio.specializationId || ""
      });
    }
  }, [ambulatorio]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData>) => {
      return await apiRequest("PATCH", `/api/ambulatori/${AMBULATORIO_ID}`, data);
    },
    onSuccess: (updatedAmbulatorio) => {
      // Invalidate ambulatorio query to refresh all cached data
      queryClient.invalidateQueries({ queryKey: ["/api/ambulatori", AMBULATORIO_ID] });
      toast({
        title: "✅ Modifiche salvate",
        description: "I dati dell'ambulatorio sono stati aggiornati con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare i dati",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-ambulatorio-title">
            Dati Ambulatorio
          </h1>
          <p className="text-muted-foreground mt-1">
            Informazioni struttura e contatti
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informazioni Generali */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informazioni Generali
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="nome">Nome Ambulatorio</Label>
              <Input
                id="nome"
                data-testid="input-nome-ambulatorio"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="specializzazione">Specializzazione</Label>
              <Select
                value={formData.specializationId}
                onValueChange={(value) => {
                  const selectedSpec = specializations.find(s => s.id === value);
                  setFormData(prev => ({ 
                    ...prev, 
                    specializationId: value,
                    specializzazione: selectedSpec?.nome || ""
                  }));
                }}
              >
                <SelectTrigger data-testid="select-specializzazione">
                  <SelectValue placeholder="Seleziona una specializzazione" />
                </SelectTrigger>
                <SelectContent>
                  {specializations.map((spec) => (
                    <SelectItem key={spec.id} value={spec.id} data-testid={`option-spec-${spec.slug}`}>
                      {spec.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="piva">P.IVA</Label>
              <Input
                id="piva"
                data-testid="input-piva"
                value={formData.piva}
                onChange={(e) => setFormData(prev => ({ ...prev, piva: e.target.value }))}
                maxLength={11}
                required
              />
            </div>
          </div>
        </Card>

        {/* Indirizzo */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Indirizzo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="indirizzo">Via</Label>
              <Input
                id="indirizzo"
                data-testid="input-indirizzo"
                value={formData.indirizzo}
                onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="citta">Città</Label>
              <Input
                id="citta"
                data-testid="input-citta"
                value={formData.citta}
                onChange={(e) => setFormData(prev => ({ ...prev, citta: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  data-testid="input-provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value.toUpperCase() }))}
                  maxLength={2}
                  placeholder="MI"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cap">CAP</Label>
                <Input
                  id="cap"
                  data-testid="input-cap"
                  value={formData.cap}
                  onChange={(e) => setFormData(prev => ({ ...prev, cap: e.target.value }))}
                  maxLength={5}
                  placeholder="20100"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="regione">Regione</Label>
              <Input
                id="regione"
                data-testid="input-regione"
                value={formData.regione}
                onChange={(e) => setFormData(prev => ({ ...prev, regione: e.target.value }))}
                required
              />
            </div>
          </div>
        </Card>

        {/* Contatti */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Contatti
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefono
              </Label>
              <Input
                id="telefono"
                type="tel"
                data-testid="input-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                placeholder="+39 02 1234567"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@ambulatorio.it"
                required
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="hover-elevate active-elevate-2"
            data-testid="button-salva-ambulatorio"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salva Modifiche
              </>
            )}
          </Button>
          <Link href="/dashboard/impostazioni">
            <Button
              type="button"
              variant="outline"
              className="hover-elevate active-elevate-2"
              data-testid="button-annulla"
            >
              Annulla
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
