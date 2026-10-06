import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useMe } from "@/lib/useUser";

function useSetupStatus(enabled: boolean) {
  return useQuery<{ needsSetup: boolean }>({ queryKey: ["/api/setup/status"], enabled });
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/** Renders children only for signed-in users; otherwise sends them to setup (fresh install) or login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const me = useMe();
  const signedOut = me.isSuccess && !me.data;
  const setup = useSetupStatus(signedOut);

  useEffect(() => {
    if (signedOut && setup.data) {
      navigate(setup.data.needsSetup ? "/setup" : "/login", { replace: true });
    }
  }, [signedOut, setup.data, navigate]);

  if (me.data) return <>{children}</>;
  return <FullScreenLoader />;
}

/** Login and setup pages: skip them when already signed in, and keep each one reachable only in the right state. */
export function GuestOnly({ page, children }: { page: "login" | "setup"; children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const me = useMe();
  const signedOut = me.isSuccess && !me.data;
  const setup = useSetupStatus(signedOut);

  const redirect = me.data
    ? "/dashboard"
    : setup.data && page === "login" && setup.data.needsSetup
      ? "/setup"
      : setup.data && page === "setup" && !setup.data.needsSetup
        ? "/login"
        : null;

  useEffect(() => {
    if (redirect) navigate(redirect, { replace: true });
  }, [redirect, navigate]);

  if (signedOut && setup.data && !redirect) return <>{children}</>;
  return <FullScreenLoader />;
}
