export const PLANS = {
  BASE: {
    name: 'Base',
    price: 89,
    priceId: 'base',
    features: [
      'pazienti',
      'appuntamenti',
      'cartella-clinica',
      'fuzzy-search',
      'statistiche-base',
      'export-pdf'
    ],
    limits: {
      pazienti: 200,
      utenti: 2
    },
    description: 'Perfetto per piccoli studi medici'
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 199,
    priceId: 'professional',
    features: [
      'pazienti',
      'appuntamenti',
      'cartella-clinica',
      'fuzzy-search',
      'ai-agent-search',
      'statistiche-avanzate',
      'analytics-predittive',
      'telemedicina',
      'export-pdf',
      'api-access'
    ],
    limits: {
      pazienti: 1000,
      utenti: 5
    },
    description: 'Per studi in crescita con funzionalità AI'
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 399,
    priceId: 'enterprise',
    features: [
      'pazienti',
      'appuntamenti',
      'cartella-clinica',
      'fuzzy-search',
      'ai-agent-search',
      'statistiche-avanzate',
      'analytics-predittive',
      'telemedicina',
      'export-pdf',
      'api-access',
      'white-label',
      'supporto-prioritario',
      'account-manager',
      'multi-sede'
    ],
    limits: {
      pazienti: -1,
      utenti: -1
    },
    description: 'Soluzione completa per grandi organizzazioni'
  }
} as const;

export type PlanKey = keyof typeof PLANS;

export interface SubscriptionCheck {
  piano: string;
  features: string[];
}

export function hasFeature(
  subscription: SubscriptionCheck | null,
  feature: string
): boolean {
  if (!subscription) return false;
  
  const plan = PLANS[subscription.piano as PlanKey];
  if (!plan) return false;
  
  return plan.features.includes(feature as any) || subscription.features.includes(feature);
}

export function canUpgrade(currentPlan: PlanKey): boolean {
  const order: PlanKey[] = ['BASE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = order.indexOf(currentPlan);
  return currentIndex < order.length - 1;
}

export function canDowngrade(currentPlan: PlanKey): boolean {
  const order: PlanKey[] = ['BASE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = order.indexOf(currentPlan);
  return currentIndex > 0;
}

export function getNextPlan(currentPlan: PlanKey): PlanKey | null {
  const order: PlanKey[] = ['BASE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = order.indexOf(currentPlan);
  return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
}

export function getPreviousPlan(currentPlan: PlanKey): PlanKey | null {
  const order: PlanKey[] = ['BASE', 'PROFESSIONAL', 'ENTERPRISE'];
  const currentIndex = order.indexOf(currentPlan);
  return currentIndex > 0 ? order[currentIndex - 1] : null;
}

export const FEATURE_NAMES: Record<string, string> = {
  'pazienti': 'Gestione Pazienti',
  'appuntamenti': 'Gestione Appuntamenti',
  'cartella-clinica': 'Cartella Clinica Digitale',
  'fuzzy-search': 'Ricerca Fuzzy Intelligente',
  'ai-agent-search': '🤖 AI Agent Search Semantico',
  'statistiche-base': 'Statistiche Base',
  'statistiche-avanzate': 'Statistiche Avanzate',
  'analytics-predittive': 'Analytics Predittive',
  'telemedicina': 'Telemedicina',
  'export-pdf': 'Export PDF',
  'api-access': 'API Access',
  'white-label': 'White Label',
  'supporto-prioritario': 'Supporto Prioritario 24/7',
  'account-manager': 'Account Manager Dedicato',
  'multi-sede': 'Gestione Multi-Sede'
};
