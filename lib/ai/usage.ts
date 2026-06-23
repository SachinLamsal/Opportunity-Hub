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
  activeTier: AiTierId | "exhausted";
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
  for (const tier of AI_TIERS) {
    if (remainingForTier(row, tier.id) > 0) {
      return tier;
    }
  }
  return null;
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
    throw new Error(
      `Could not load AI usage. Run supabase/migrate-ai-usage.sql — ${selectError.message}`,
    );
  }

  if (!existing) {
    const { data: created, error: insertError } = await supabase
      .from("ai_user_usage")
      .insert({ user_id: userId, reset_month: month })
      .select("*")
      .single();

    if (insertError || !created) {
      throw new Error(
        `Could not create AI usage row. Run supabase/migrate-ai-usage.sql — ${insertError?.message}`,
      );
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
      throw new Error(`Could not reset AI usage — ${resetError?.message}`);
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
    activeTier: active?.id ?? "exhausted",
    activeTierLabel: active?.label ?? "No credits left",
    resetMonth: row.reset_month,
    tiers: AI_TIERS.map((tier) => {
      const used = usedForTier(row, tier.id);
      const limit = limits[tier.id];
      return {
        id: tier.id,
        label: tier.label,
        used,
        limit,
        remaining: Math.max(0, limit - used),
      };
    }),
  };
}

async function consumeTierCredit(userId: string, tierId: AiTierId): Promise<void> {
  const supabase = await createClient();
  const row = await getOrCreateUsageRow(userId);
  const column =
    tierId === "premium"
      ? "premium_used"
      : tierId === "standard"
        ? "standard_used"
        : "basic_used";

  const { error } = await supabase
    .from("ai_user_usage")
    .update({
      [column]: usedForTier(row, tierId) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not record AI usage — ${error.message}`);
  }
}

export interface GenerateWithQuotaResult extends GenerateTextResult {
  tierUsed?: AiTierId;
  tierLabel?: string;
}

/**
 * Picks the user's best available tier, calls Gemini once, and deducts one credit
 * only after a successful response.
 */
export async function generateWithUserQuota(
  userId: string,
  prompt: string,
): Promise<GenerateWithQuotaResult> {
  const row = await getOrCreateUsageRow(userId);
  const tier = resolveActiveTier(row);

  if (!tier) {
    const limits = getTierLimits();
    const total =
      limits.premium + limits.standard + limits.basic;
    return {
      text: null,
      error: `You have used all ${total} AI credits for this month. Credits reset on the 1st. Saved opportunity details still load without using credits.`,
    };
  }

  const result = await generateTextWithTier(prompt, tier);

  if (result.text) {
    await consumeTierCredit(userId, tier.id);
    return {
      ...result,
      tierUsed: tier.id,
      tierLabel: tier.label,
    };
  }

  return result;
}

export function formatUsageHint(summary: AiUsageSummary): string {
  const active = summary.tiers.find((t) => t.id === summary.activeTier);
  if (!active || summary.activeTier === "exhausted") {
    return "No AI credits left this month.";
  }
  return `Using ${summary.activeTierLabel} · ${active.remaining} credit${active.remaining === 1 ? "" : "s"} left in this tier`;
}
