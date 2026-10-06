import type { Express } from "express";
import { requireAuth } from "../authz";
import { registerSetupRoutes, registerAccountRoutes } from "../account-routes";
import { registerPricingLeadRoutes } from "./pricing-leads";
import { registerAmbulatorioRoutes } from "./ambulatori";
import { registerPazienteRoutes } from "./pazienti";
import { registerAppuntamentoRoutes } from "./appuntamenti";
import { registerVisitaRoutes } from "./visite";
import { registerDashboardRoutes } from "./dashboard";
import { registerAiRoutes } from "./ai";
import { registerThemeRoutes } from "./theme";
import { registerOnboardingRoutes } from "./onboarding";
import { registerSpecializationRoutes } from "./specializations";
import { registerPreferenceRoutes } from "./preferences";

export function registerRoutes(app: Express): void {
  // Public routes.
  registerPricingLeadRoutes(app);
  registerSetupRoutes(app);

  // Everything below requires a signed-in user and is scoped to their ambulatorio.
  app.use("/api", requireAuth);
  registerAccountRoutes(app);
  registerAmbulatorioRoutes(app);
  registerPazienteRoutes(app);
  registerAppuntamentoRoutes(app);
  registerVisitaRoutes(app);
  registerDashboardRoutes(app);
  registerAiRoutes(app);
  registerThemeRoutes(app);
  registerOnboardingRoutes(app);
  registerSpecializationRoutes(app);
  registerPreferenceRoutes(app);
}
