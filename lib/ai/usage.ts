import { createClient } from "@/lib/supabase/server";
import {
  AI_TIERS,
  getTierLimits,
  type AiTier,
  type AiTierId,
} from "@/lib/ai/tiers";
import { generateTextWithTier, type GenerateTextResult } from "@/lib/ai/gemini";

export interface AiUsageTierSummary {
  id: AiTierId;
  label: string;
  used: number;
  limit: number;
  remaining: number;
}

export interface AiUsageSummary {
  activeTier: AiTierId | "unlimited";
  activeTierLabel: string;
  resetMonth: string;
  tiers: AiUsageTierSummary[];
}

interface UsageRow {
  user_id: string;
  premium_used: number;
  standard_used: number;
  basic_used: number;
  reset_month: string;
}

function currentResetMonth(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

function usedForTier(row: UsageRow, tierId: AiTierId): number {
  switch (tierId) {
    case "premium":
      return row.premium_used;
    case "standard":
      return row.standard_used;
    case "basic":
      return row.basic_used;
  }
}

function remainingForTier(row: UsageRow, tierId: AiTierId): number {
  const limits = getTierLimits();
  return Math.max(0, limits[tierId] - usedForTier(row, tierId));
}

export function resolveActiveTier(row: UsageRow): AiTier | null {
  // Usage limits disabled - always return premium tier
  return AI_TIERS[0]; // premium tier
}

async function getOrCreateUsageRow(userId: string): Promise<UsageRow> {
  const supabase = await createClient();
  const month = currentResetMonth();

  const { data: existing, error: selectError } = await supabase
    .from("ai_user_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    // Usage table optional - continue without error
    return {
      user_id: userId,
      premium_used: 0,
      standard_used: 0,
      basic_used: 0,
      reset_month: month,
    };
  }

  if (!existing) {
    const { data: created, error: insertError } = await supabase
      .from("ai_user_usage")
      .insert({ user_id: userId, reset_month: month })
      .select("*")
      .single();

    if (insertError || !created) {
      // Usage table optional - continue without error
      return {
        user_id: userId,
        premium_used: 0,
        standard_used: 0,
        basic_used: 0,
        reset_month: month,
      };
    }

    return created as UsageRow;
  }

  const row = existing as UsageRow;

  if (row.reset_month !== month) {
    const { data: reset, error: resetError } = await supabase
      .from("ai_user_usage")
      .update({
        premium_used: 0,
        standard_used: 0,
        basic_used: 0,
        reset_month: month,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (resetError || !reset) {
      // Reset failed - return row with reset month updated
      return {
        ...row,
        reset_month: month,
        premium_used: 0,
        standard_used: 0,
        basic_used: 0,
      };
    }

    return reset as UsageRow;
  }

  return row;
}

export async function getAIUsageSummaryForUser(
  userId: string,
): Promise<AiUsageSummary> {
  const row = await getOrCreateUsageRow(userId);
  const limits = getTierLimits();
  const active = resolveActiveTier(row);

  return {
    activeTier: "unlimited",
    activeTierLabel: "Unlimited",
    resetMonth: row.reset_month,
    tiers: AI_TIERS.map((tier) => {
      const used = 0;
      const limit = Infinity;
      return {
        id: tier.id,
        label: tier.label,
        used,
        limit,
        remaining: Infinity,
      };
    }),
  };
}

async function consumeTierCredit(userId: string, tierId: AiTierId): Promise<void> {
  // Credit consumption disabled
  return;
}

export interface GenerateWithQuotaResult extends GenerateTextResult {
  tierUsed?: AiTierId;
  tierLabel?: string;
}

/**
 * Calls Gemini with the best available tier and does not track usage.
 */
export async function generateWithUserQuota(
  userId: string,
  prompt: string,
): Promise<GenerateWithQuotaResult> {
  const row = await getOrCreateUsageRow(userId);
  const tier = resolveActiveTier(row);

  if (!tier) {
    return {
      text: null,
      error: `AI service unavailable. Please try again later.`,
    };
  }

  const result = await generateTextWithTier(prompt, tier);

  if (result.text) {
    return {
      ...result,
      tierUsed: tier.id,
      tierLabel: tier.label,
    };
  }

  return result;
}

export function formatUsageHint(summary: AiUsageSummary): string {
  return `AI enabled · unlimited usage`;
}
