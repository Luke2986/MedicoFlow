import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { postJson, signIn } from "@/lib/auth";
import { enterDemo, resetDemo, useDemo } from "@/lib/demo";

const MIN_PASSWORD_LENGTH = 10;

export default function SetupPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ nomeAmbulatorio: "", nome: "", cognome: "", email: "", password: "", conferma: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const demo = useDemo();

  const loadDemoData = async () => {
    setError("");
    setLoading(true);
    try {
      await resetDemo("demo");
      await enterDemo();
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      return setError(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri`);
    }
    if (form.password !== form.conferma) {
      return setError("Le password non coincidono");
    }
    setLoading(true);
    try {
      const { conferma, ...payload } = form;
      await postJson("/api/setup", payload);
      await signIn(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Benvenuto in MedicoFlow" subtitle="Crea l'account amministratore del tuo ambulatorio. Potrai aggiungere i collaboratori in seguito.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nomeAmbulatorio">Nome dell'ambulatorio</Label>
          <Input id="nomeAmbulatorio" required value={form.nomeAmbulatorio} onChange={update("nomeAmbulatorio")} data-testid="input-setup-ambulatorio" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" autoComplete="given-name" required value={form.nome} onChange={update("nome")} data-testid="input-setup-nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cognome">Cognome</Label>
            <Input id="cognome" autoComplete="family-name" required value={form.cognome} onChange={update("cognome")} data-testid="input-setup-cognome" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} data-testid="input-setup-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={update("password")} data-testid="input-setup-password" />
          <p className="text-xs text-muted-foreground">Almeno {MIN_PASSWORD_LENGTH} caratteri.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="conferma">Conferma password</Label>
          <Input id="conferma" type="password" autoComplete="new-password" required value={form.conferma} onChange={update("conferma")} data-testid="input-setup-conferma" />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading} data-testid="button-setup">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Crea account
        </Button>
        {demo.data?.demo && (
          <Button type="button" variant="ghost" className="w-full" onClick={loadDemoData} disabled={loading} data-testid="button-demo-load">
            Oppure carica i dati di esempio
          </Button>
        )}
      </form>
    </AuthShell>
  );
}
