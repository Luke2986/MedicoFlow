import { useQuery } from "@tanstack/react-query";
import { useAmbulatorio } from "./useAmbulatorio";

interface User {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: string;
  ambulatorioId: string;
}

// Since there's no auth system, get the default medico user for the current ambulatorio
export function useUser() {
  const { ambulatorioId } = useAmbulatorio();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/ambulatorio", ambulatorioId, "default"],
    queryFn: async () => {
      const res = await fetch(`/api/users/ambulatorio/${ambulatorioId}/default`);
      if (!res.ok) throw new Error("Errore caricamento utente");
      return res.json();
    },
    enabled: !!ambulatorioId,
  });

  return {
    userId: user?.id || "",
    user,
  };
}
