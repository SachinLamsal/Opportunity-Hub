"use server";

import { isGeminiConfigured } from "@/lib/ai/gemini";
import {
  buildCVPrompt,
  buildSuggestionsPrompt,
  parseCVJSON,
  parseSuggestionsJSON,
  type AICVEnhancement,
  type AISuggestionResult,
} from "@/lib/ai/prompts";
import { getFallbackSuggestions } from "@/lib/ai/fallback";
import { generateWithUserQuota } from "@/lib/ai/usage";
import {
  buildCVFromProfile,
  cvToPlainText,
  summarizeActivitiesForAI,
  summarizeOpportunitiesForAI,
  summarizeProfileForAI,
} from "@/lib/cv/generate";
import { getProfile } from "@/lib/actions/auth";
import { getActivities } from "@/lib/queries/activities";
import { getOpportunities } from "@/lib/queries/opportunities";
import { createClient } from "@/lib/supabase/server";

export interface AIActionResult<T> {
  data: T;
  source: "ai" | "fallback";
  error?: string;
  tierLabel?: string;
}

async function getUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getAISuggestions(): Promise<
  AIActionResult<AISuggestionResult>
> {
  const [profile, activities, opportunities, userId] = await Promise.all([
    getProfile(),
    getActivities(),
    getOpportunities({ limit: 20 }),
    getUserId(),
  ]);

  if (!profile || !userId) {
    return {
      data: getFallbackSuggestions(null, [], opportunities),
      source: "fallback",
      error: "Not logged in.",
    };
  }

  if (!isGeminiConfigured()) {
    return {
      data: getFallbackSuggestions(profile, activities, opportunities),
      source: "fallback",
    };
  }

  const prompt = buildSuggestionsPrompt(
    summarizeProfileForAI(profile),
    summarizeActivitiesForAI(activities),
    summarizeOpportunitiesForAI(opportunities),
  );

  const {
    text: response,
    error: geminiError,
    tierLabel,
  } = await generateWithUserQuota(userId, prompt);

  if (!response) {
    return {
      data: getFallbackSuggestions(profile, activities, opportunities),
      source: "fallback",
      error: geminiError ?? "AI unavailable. Showing basic suggestions instead.",
    };
  }

  const parsed = parseSuggestionsJSON(response);

  if (!parsed) {
    return {
      data: getFallbackSuggestions(profile, activities, opportunities),
      source: "fallback",
      error: "Could not parse AI response. Showing basic suggestions.",
    };
  }

  const validIds = new Set(opportunities.map((o) => o.id));
  parsed.suggestedOpportunities = parsed.suggestedOpportunities.filter((s) =>
    validIds.has(s.opportunityId),
  );

  if (parsed.suggestedOpportunities.length === 0 && opportunities.length > 0) {
    parsed.suggestedOpportunities = opportunities.slice(0, 3).map((o) => ({
      opportunityId: o.id,
      title: o.title,
      reason: "Recommended based on your profile — open the page for prep resources.",
    }));
  }

  return { data: parsed, source: "ai", tierLabel };
}

export async function enhanceCVWithAI(): Promise<
  AIActionResult<AICVEnhancement | null>
> {
  const [profile, activities, userId] = await Promise.all([
    getProfile(),
    getActivities(),
    getUserId(),
  ]);

  if (!profile || !userId) {
    return { data: null, source: "fallback", error: "Not logged in." };
  }

  if (activities.length === 0) {
    return {
      data: null,
      source: "fallback",
      error: "Add some activities first before using AI enhancement.",
    };
  }

  const cv = buildCVFromProfile(profile, activities);
  const plainText = cvToPlainText(cv);

  if (!isGeminiConfigured()) {
    return {
      data: null,
      source: "fallback",
      error: "Gemini API key not configured. CV shown without AI enhancement.",
    };
  }

  const prompt = buildCVPrompt(
    summarizeProfileForAI(profile),
    summarizeActivitiesForAI(activities),
    plainText,
  );

  const {
    text: response,
    error: geminiError,
    tierLabel,
  } = await generateWithUserQuota(userId, prompt);

  if (!response) {
    return {
      data: null,
      source: "fallback",
      error: geminiError ?? "AI unavailable right now. Your CV is still shown below.",
    };
  }

  const parsed = parseCVJSON(response);

  if (!parsed) {
    return {
      data: null,
      source: "fallback",
      error: "Could not parse AI response.",
    };
  }

  return { data: parsed, source: "ai", tierLabel };
}
