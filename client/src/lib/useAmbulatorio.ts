import { useQuery } from "@tanstack/react-query";

// Placeholder row inserted by older seeds; it has no users, so it must never be selected.
const LEGACY_PLACEHOLDER_ID = "default-ambulatorio-id";

export function useAmbulatorio() {
  const { data: ambulatori = [] } = useQuery<any[]>({
    queryKey: ["/api/ambulatori-list"],
    queryFn: async () => {
      const res = await fetch("/api/ambulatori-list");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const ambulatorio = ambulatori.find((a) => a.id !== LEGACY_PLACEHOLDER_ID);
  const ambulatorioId: string = ambulatorio?.id ?? "";

  return { ambulatorioId, ambulatorio };
}
