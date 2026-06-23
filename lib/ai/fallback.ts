import type { Activity, Opportunity, Profile } from "@/lib/types";
import type { AISuggestionResult } from "@/lib/ai/prompts";
import { getWeakestCategories, calculatePortfolioScores } from "@/lib/portfolio/score";

export function getFallbackSuggestions(
  profile: Profile | null,
  activities: Activity[],
  opportunities: Opportunity[],
): AISuggestionResult {
  const scores = calculatePortfolioScores(activities);
  const weakCategories = getWeakestCategories(scores, 3);

  const explanation =
    activities.length === 0
      ? "You're just getting started. Add a few activities and explore opportunities that match your goals."
      : weakCategories.length > 0
        ? `You have ${activities.length} activities logged. Focus on strengthening ${weakCategories.join(", ")} to balance your portfolio.`
        : `You have a solid spread across ${activities.length} activities. Keep exploring new opportunities.`;

  const suggestedOpportunities = opportunities.slice(0, 3).map((o) => ({
    opportunityId: o.id,
    title: o.title,
    reason: `Matches your ${profile?.education_level ?? "current"} level and supports portfolio building in ${o.subject_area ?? "multiple areas"}.`,
  }));

  const nextSteps: string[] = [];

  if (activities.length === 0) {
    nextSteps.push("Add at least one activity you've already completed to your portfolio.");
  }

  if (weakCategories.length > 0) {
    nextSteps.push(`Look for opportunities in ${weakCategories[0]} to strengthen that category.`);
  }

  nextSteps.push("Save 2–3 opportunities from the feed that interest you.");
  nextSteps.push("Update your profile with subjects and career interests for better matches.");

  return {
    explanation,
    suggestedOpportunities,
    nextSteps: nextSteps.slice(0, 3),
  };
}
