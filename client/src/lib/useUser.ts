import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: string;
  ambulatorioId: string;
}

// Since there's no auth system, get the default medico user
export function useUser() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/email/mario.rossi@ambulatoriorossi.it"],
    queryFn: async () => {
      const res = await fetch("/api/users/email/mario.rossi@ambulatoriorossi.it");
      if (!res.ok) throw new Error("Errore caricamento utente");
      return res.json();
    },
  });

  return {
    userId: user?.id || "",
    user,
  };
}
