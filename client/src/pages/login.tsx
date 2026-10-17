import { useState } from "react";
import { useLocation } from "wouter";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { signIn } from "@/lib/auth";
import { enterDemo, useDemo } from "@/lib/demo";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const demo = useDemo();

  const handleDemo = async () => {
    setError("");
    setDemoLoading(true);
    try {
      await enterDemo();
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Accedi" subtitle="Inserisci le credenziali del tuo account.">
      {demo.data?.hasDemoData && (
        <div className="mb-6 rounded-md border border-primary/30 bg-primary/5 p-4 space-y-3" data-testid="box-demo">
          <div className="flex items-start gap-2 text-sm">
            <FlaskConical className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <p className="text-muted-foreground">
              Questa è una <strong className="text-foreground">demo</strong> con dati inventati: entra e prova l'app senza registrarti.
            </p>
          </div>
          <Button type="button" className="w-full" onClick={handleDemo} disabled={demoLoading} data-testid="button-demo-enter">
            {demoLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Entra nella demo
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-login-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-login-password" />
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading} data-testid="button-login">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Accedi
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Password dimenticata? Chiedi all'amministratore del tuo ambulatorio di reimpostarla.
        </p>
      </form>
    </AuthShell>
  );
}
