import type { Express } from "express";
import { requireAuth } from "../authz";
import { isInMemory } from "../db";
import { registerDemoRoutes } from "./demo";
import { registerSetupRoutes, registerAccountRoutes } from "../account-routes";
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
import { registerDocumentoSpesaRoutes } from "./documenti-spesa";
import { registerSistemaTsRoutes } from "./sistema-ts";

export function registerRoutes(app: Express): void {
  // Public routes.
  registerSetupRoutes(app);
  if (isInMemory) registerDemoRoutes(app);

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
  registerDocumentoSpesaRoutes(app);
  registerSistemaTsRoutes(app);
}
