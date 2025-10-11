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

  const ambulatorioId = ambulatori[0]?.id || "default-ambulatorio-id";
  
  return { ambulatorioId, ambulatorio: ambulatori[0] };
}
