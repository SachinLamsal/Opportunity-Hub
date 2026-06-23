export type AiTierId = "premium" | "standard" | "basic";

export interface AiTier {
  id: AiTierId;
  label: string;
  models: readonly string[];
  maxOutputTokens: number;
  temperature: number;
}

/** Best → weakest. Users start on premium and downgrade when that tier is exhausted. */
export const AI_TIERS: readonly AiTier[] = [
  {
    id: "premium",
    label: "Main AI",
    models: ["gemini-2.0-flash", "gemini-2.5-flash"],
    maxOutputTokens: 4096,
    temperature: 0.2,
  },
  {
    id: "standard",
    label: "Standard AI",
    models: ["gemini-2.0-flash-lite", "gemini-2.5-flash-lite"],
    maxOutputTokens: 2048,
    temperature: 0.2,
  },
  {
    id: "basic",
    label: "Basic AI",
    models: ["gemini-2.0-flash-lite"],
    maxOutputTokens: 1024,
    temperature: 0.1,
  },
] as const;

function parseLimit(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getTierLimits(): Record<AiTierId, number> {
  return {
    premium: parseLimit(process.env.AI_TIER_PREMIUM_LIMIT, 8),
    standard: parseLimit(process.env.AI_TIER_STANDARD_LIMIT, 15),
    basic: parseLimit(process.env.AI_TIER_BASIC_LIMIT, 25),
  };
}

export function getTierById(id: AiTierId): AiTier {
  const tier = AI_TIERS.find((t) => t.id === id);
  if (!tier) {
    throw new Error(`Unknown AI tier: ${id}`);
  }
  return tier;
}
