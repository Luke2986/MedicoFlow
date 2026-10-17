import { useQuery } from "@tanstack/react-query";
import { postJson } from "./auth";
import { queryClient } from "./queryClient";

type DemoStatus = { demo: boolean; hasDemoData: boolean };

/** Demo routes exist only when the server runs without an external database; elsewhere the request is rejected. */
export function useDemo() {
  return useQuery<DemoStatus>({
    queryKey: ["/api/demo"],
    queryFn: async () => {
      const res = await fetch("/api/demo", { credentials: "include" });
      if (!res.ok) return { demo: false, hasDemoData: false };
      return res.json();
    },
    staleTime: Infinity,
  });
}

export async function enterDemo() {
  await postJson("/api/demo/session");
  queryClient.clear();
}

export async function resetDemo(mode: "demo" | "empty") {
  await postJson("/api/demo/reset", { mode });
  queryClient.clear();
}
