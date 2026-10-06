import { queryClient } from "./queryClient";

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || "Si è verificato un errore") as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function signIn(email: string, password: string) {
  try {
    await postJson("/api/auth/sign-in/email", { email, password });
  } catch (error) {
    const status = (error as { status?: number }).status;
    throw new Error(status === 429 ? "Troppi tentativi, riprova tra un minuto" : "Email o password non corretti");
  }
  queryClient.clear();
}

export async function signOut() {
  await postJson("/api/auth/sign-out");
  queryClient.clear();
}

export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    await postJson("/api/auth/change-password", { currentPassword, newPassword, revokeOtherSessions: true });
  } catch (error) {
    const status = (error as { status?: number }).status;
    throw new Error(status === 429 ? "Troppi tentativi, riprova tra un minuto" : "Password attuale non corretta");
  }
}

export { postJson };
