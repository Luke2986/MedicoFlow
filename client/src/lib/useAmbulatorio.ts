import { useQuery } from "@tanstack/react-query";

export function useAmbulatorio() {
  const { data: ambulatori = [] } = useQuery<any[]>({
    queryKey: ["/api/ambulatori-list"],
    queryFn: async () => {
      const res = await fetch("/api/ambulatori-list");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const ambulatorio = ambulatori[0];
  const ambulatorioId: string = ambulatorio?.id ?? "";

  return { ambulatorioId, ambulatorio };
}
