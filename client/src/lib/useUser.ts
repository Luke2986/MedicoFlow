import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "./queryClient";

export interface CurrentUser {
  id: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: "admin" | "medico" | "segreteria";
  ambulatorioId: string;
}

export function useMe() {
  return useQuery<{ user: CurrentUser } | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
}

export function useUser() {
  const { data } = useMe();
  const user = data?.user;
  return {
    userId: user?.id || "",
    user,
    isAdmin: user?.ruolo === "admin",
  };
}
