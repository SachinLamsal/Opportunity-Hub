"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { getAISuggestions, type AIActionResult } from "@/lib/actions/ai";
import type { AISuggestionResult } from "@/lib/ai/prompts";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import AITokenBadge from "@/components/ai/AITokenBadge";

interface AISuggestionsPanelProps {
  compact?: boolean;
}

export default function AISuggestionsPanel({ compact = false }: AISuggestionsPanelProps) {
  const [result, setResult] = useState<AIActionResult<AISuggestionResult> | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function loadSuggestions() {
    startTransition(async () => {
      const data = await getAISuggestions();
      setResult(data);
    });
  }

  const placeholder = result?.data ?? {
    explanation:
      "Get personalised opportunity matches and prep-focused next steps. Uses one AI credit — page refresh does not call AI.",
    suggestedOpportunities: [],
    nextSteps: [],
  };

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {compact ? "AI suggestions" : "Your personalised suggestions"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {result?.source === "ai"
              ? `Powered by Gemini${result.tierLabel ? ` (${result.tierLabel})` : ""} · picks real opportunities from the app`
              : "Click below to generate — saved opportunity pages never use your credits on refresh"}
          </p>
        </div>
        {result && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadSuggestions}
            disabled={isPending}
          >
            {isPending ? "Loading…" : "Refresh suggestions"}
          </Button>
        )}
      </div>

      <div className="mt-4">
        <AITokenBadge />
      </div>

      {!result && (
        <div className="mt-4">
          <Button type="button" onClick={loadSuggestions} disabled={isPending}>
            {isPending ? "Generating…" : "Get AI suggestions"}
          </Button>
        </div>
      )}

      {result?.error && (
        <p className="mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
          {result.error}
        </p>
      )}

      {result && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-slate-700">
            {placeholder.explanation}
          </p>

          {placeholder.nextSteps.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">Next steps</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                {placeholder.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {placeholder.suggestedOpportunities.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Suggested opportunities
              </h3>
              <ul className="mt-2 space-y-3">
                {placeholder.suggestedOpportunities.map((item) => (
                  <li
                    key={item.opportunityId}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <Link
                      href={`/opportunities/${item.opportunityId}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-slate-600">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {compact && result && (
        <Link
          href="/ai-suggestions"
          className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View full AI suggestions →
        </Link>
      )}
    </Card>
  );
}
