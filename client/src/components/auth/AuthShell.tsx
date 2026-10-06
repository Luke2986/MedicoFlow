import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">MedicoFlow</span>
        </div>
        <Card className="p-6 sm:p-8">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}
