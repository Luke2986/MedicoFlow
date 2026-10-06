import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, KeyRound, Loader2, Trash2, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useUser } from "@/lib/useUser";
import { changePassword, postJson } from "@/lib/auth";

const MIN_PASSWORD_LENGTH = 10;
const RUOLO_LABEL: Record<string, string> = { admin: "Amministratore", medico: "Medico", segreteria: "Segreteria" };

interface Member {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: string;
}

async function deleteRequest(url: string) {
  const res = await fetch(url, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Si è verificato un errore");
  }
}

export default function TeamPage() {
  const { toast } = useToast();
  const { user, isAdmin } = useUser();
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const { data: members = [], isLoading } = useQuery<Member[]>({ queryKey: ["/api/team"] });

  const onError = (error: Error) => toast({ title: "Errore", description: error.message, variant: "destructive" });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRequest(`/api/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Utente eliminato" });
      setDeleteTarget(null);
    },
    onError,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/impostazioni" data-testid="link-back-impostazioni">
          <Button variant="ghost" size="icon" className="hover-elevate" aria-label="Torna alle impostazioni">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-team-title">
            Gestione Team
          </h1>
          <p className="text-muted-foreground mt-1">Utenti che possono accedere al tuo ambulatorio</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)} data-testid="button-add-member">
            <UserPlus className="w-4 h-4 mr-2" />
            Aggiungi utente
          </Button>
        )}
      </div>

      <Card className="divide-y divide-border">
        {isLoading ? (
          <div className="p-6 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4" data-testid={`row-member-${m.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">
                    {m.nome} {m.cognome}
                  </span>
                  {m.id === user?.id && <span className="text-xs text-muted-foreground">(tu)</span>}
                </div>
                <span className="text-sm text-muted-foreground truncate block">{m.email}</span>
              </div>
              <Badge variant="secondary">{RUOLO_LABEL[m.ruolo] ?? m.ruolo}</Badge>
              {isAdmin && m.id !== user?.id && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setResetTarget(m)} data-testid={`button-reset-${m.id}`}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    Reimposta password
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setDeleteTarget(m)}
                    aria-label={`Elimina ${m.nome} ${m.cognome}`}
                    data-testid={`button-delete-${m.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </Card>

      <ChangeOwnPassword />

      <AddMemberDialog open={addOpen} onOpenChange={setAddOpen} onError={onError} />
      <ResetPasswordDialog member={resetTarget} onClose={() => setResetTarget(null)} onError={onError} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo utente?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.nome} {deleteTarget?.cognome} non potrà più accedere. L'operazione non è reversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  onError,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (e: Error) => void;
}) {
  const { toast } = useToast();
  const empty = { nome: "", cognome: "", email: "", ruolo: "medico", password: "" };
  const [form, setForm] = useState(empty);

  const mutation = useMutation({
    mutationFn: () => postJson("/api/team", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      toast({ title: "Utente aggiunto", description: "Comunica all'utente la password temporanea." });
      setForm(empty);
      onOpenChange(false);
    },
    onError,
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aggiungi utente</DialogTitle>
          <DialogDescription>L'utente potrà cambiare la password dopo il primo accesso.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="m-nome">Nome</Label>
              <Input id="m-nome" required value={form.nome} onChange={update("nome")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-cognome">Cognome</Label>
              <Input id="m-cognome" required value={form.cognome} onChange={update("cognome")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-email">Email</Label>
            <Input id="m-email" type="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-ruolo">Ruolo</Label>
            <Select value={form.ruolo} onValueChange={(ruolo) => setForm((f) => ({ ...f, ruolo }))}>
              <SelectTrigger id="m-ruolo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medico">Medico</SelectItem>
                <SelectItem value="segreteria">Segreteria</SelectItem>
                <SelectItem value="admin">Amministratore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="m-password">Password temporanea</Label>
            <Input
              id="m-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={form.password}
              onChange={update("password")}
            />
            <p className="text-xs text-muted-foreground">Almeno {MIN_PASSWORD_LENGTH} caratteri.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending} data-testid="button-save-member">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aggiungi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  member,
  onClose,
  onError,
}: {
  member: Member | null;
  onClose: () => void;
  onError: (e: Error) => void;
}) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => postJson(`/api/team/${member!.id}/password`, { password }),
    onSuccess: () => {
      toast({ title: "Password reimpostata", description: "Le sessioni attive dell'utente sono state chiuse." });
      setPassword("");
      onClose();
    },
    onError,
  });

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reimposta password</DialogTitle>
          <DialogDescription>
            Nuova password per {member?.nome} {member?.cognome}.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="r-password">Nuova password</Label>
            <Input
              id="r-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              Salva
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeOwnPassword() {
  const { toast } = useToast();
  const [form, setForm] = useState({ attuale: "", nuova: "", conferma: "" });
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: () => changePassword(form.attuale, form.nuova),
    onSuccess: () => {
      toast({ title: "Password aggiornata", description: "Le altre sessioni sono state chiuse." });
      setForm({ attuale: "", nuova: "", conferma: "" });
    },
    onError: (e: Error) => setError(e.message),
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Cambia la tua password</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (form.nuova.length < MIN_PASSWORD_LENGTH) return setError(`Almeno ${MIN_PASSWORD_LENGTH} caratteri`);
          if (form.nuova !== form.conferma) return setError("Le password non coincidono");
          mutation.mutate();
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="p-attuale">Password attuale</Label>
          <Input id="p-attuale" type="password" autoComplete="current-password" required value={form.attuale} onChange={update("attuale")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-nuova">Nuova password</Label>
          <Input id="p-nuova" type="password" autoComplete="new-password" required value={form.nuova} onChange={update("nuova")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-conferma">Conferma</Label>
          <Input id="p-conferma" type="password" autoComplete="new-password" required value={form.conferma} onChange={update("conferma")} />
        </div>
        <div className="md:col-span-3 flex items-center justify-between gap-4">
          <p className="text-sm text-destructive" role="alert">{error}</p>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-change-password">
            Aggiorna password
          </Button>
        </div>
      </form>
    </Card>
  );
}
