"use client";

import { useEffect, useState } from "react";
import { getAIUsageSummary } from "@/lib/actions/ai-usage";
import type { AiUsageSummary } from "@/lib/ai/usage";

export default function AITokenBadge() {
  const [usage, setUsage] = useState<AiUsageSummary | null>(null);

  useEffect(() => {
    getAIUsageSummary().then(setUsage);
  }, []);

  if (!usage) return null;

  const active = usage.tiers.find((t) => t.id === usage.activeTier);

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
      <p className="font-medium text-slate-800">Your AI credits this month</p>
      <ul className="mt-2 space-y-1">
        {usage.tiers.map((tier) => (
          <li key={tier.id} className="flex justify-between gap-4">
            <span>
              {tier.label}
              {usage.activeTier === tier.id && tier.remaining > 0 ? " · active" : ""}
            </span>
            <span className="tabular-nums text-slate-500">
              {tier.remaining}/{tier.limit}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-slate-500">
        {usage.activeTier === "exhausted"
          ? "All credits used — resets on the 1st. Saved opportunity pages still load without credits."
          : `Next request uses ${active?.label ?? "Basic AI"}. We start with the best model and move down when a tier runs out.`}
      </p>
    </div>
  );
}
