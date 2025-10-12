import { db } from "../db";
import { aiUsage, subscriptions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const PLAN_LIMITS = {
  BASE: { 
    voiceNotes: 0, 
    autoComplete: 0, 
    analytics: 0 
  },
  PROFESSIONAL: { 
    voiceNotes: 150,
    autoComplete: -1, // unlimited
    analytics: -1     // unlimited
  },
  ENTERPRISE: { 
    voiceNotes: -1,   // unlimited
    autoComplete: -1, // unlimited
    analytics: -1     // unlimited
  }
} as const;

type PlanName = keyof typeof PLAN_LIMITS;
type FeatureName = 'voiceNotes' | 'autoComplete' | 'analytics';

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetDate: Date;
  percentageUsed: number;
}

export async function checkAIQuota(
  ambulatorioId: string,
  userId: string,
  feature: FeatureName
): Promise<QuotaResult> {
  // Get subscription
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.ambulatorioId, ambulatorioId)
  });

  if (!subscription) {
    return { 
      allowed: false, 
      used: 0, 
      limit: 0, 
      resetDate: new Date(),
      percentageUsed: 0
    };
  }

  const planLimits = PLAN_LIMITS[subscription.piano as PlanName];
  const limit = planLimits[feature];

  // If unlimited, return allowed
  if (limit === -1) {
    return { 
      allowed: true, 
      used: 0, 
      limit: -1, 
      resetDate: getNextMonthStart(),
      percentageUsed: 0
    };
  }

  // If no access (limit 0), return not allowed
  if (limit === 0) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      resetDate: getNextMonthStart(),
      percentageUsed: 0
    };
  }

  // Get current month usage for this specific user
  const currentMonth = getCurrentMonth();
  const usage = await db.query.aiUsage.findFirst({
    where: and(
      eq(aiUsage.ambulatorioId, ambulatorioId),
      eq(aiUsage.userId, userId),
      eq(aiUsage.month, currentMonth)
    )
  });

  const featureMap = {
    voiceNotes: 'voiceNotesUsed',
    autoComplete: 'autoCompleteUsed',
    analytics: 'analyticsUsed'
  } as const;

  const used = (usage?.[featureMap[feature]] as number) || 0;
  const percentageUsed = (used / limit) * 100;

  return {
    allowed: used < limit,
    used,
    limit,
    resetDate: getNextMonthStart(),
    percentageUsed
  };
}

export async function incrementAIUsage(
  ambulatorioId: string,
  userId: string,
  feature: FeatureName
): Promise<void> {
  const currentMonth = getCurrentMonth();
  const featureMap = {
    voiceNotes: 'voiceNotesUsed',
    autoComplete: 'autoCompleteUsed',
    analytics: 'analyticsUsed'
  } as const;

  // Check if record exists for this user
  const existing = await db.query.aiUsage.findFirst({
    where: and(
      eq(aiUsage.ambulatorioId, ambulatorioId),
      eq(aiUsage.userId, userId),
      eq(aiUsage.month, currentMonth)
    )
  });

  if (existing) {
    // Update existing record
    await db.update(aiUsage)
      .set({
        [featureMap[feature]]: (existing[featureMap[feature]] as number) + 1,
        updatedAt: new Date()
      })
      .where(eq(aiUsage.id, existing.id));
  } else {
    // Create new record
    await db.insert(aiUsage).values({
      ambulatorioId,
      userId,
      month: currentMonth,
      [featureMap[feature]]: 1
    });
  }
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
