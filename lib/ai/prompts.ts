export interface AISuggestionResult {
  explanation: string;
  suggestedOpportunities: {
    opportunityId: string;
    title: string;
    reason: string;
  }[];
  nextSteps: string[];
}

export interface AICVEnhancement {
  bulletPoints: string[];
  summary: string;
}

export function buildSuggestionsPrompt(
  profileSummary: string,
  activitiesSummary: string,
  opportunitiesSummary: string,
): string {
  return `You are a helpful advisor for secondary school students in Kathmandu, Nepal building university portfolios.

STUDENT PROFILE:
${profileSummary}

CURRENT ACTIVITIES:
${activitiesSummary}

AVAILABLE OPPORTUNITIES (pick ONLY from this list — use exact IDs):
${opportunitiesSummary}

Respond with valid JSON only, no markdown, in this exact shape:
{
  "explanation": "1-2 sentence overview of their portfolio situation",
  "suggestedOpportunities": [
    { "opportunityId": "uuid-from-list", "title": "exact title", "reason": "one sentence why it fits" }
  ],
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Rules:
- Suggest exactly 3 opportunities from the provided list only — use exact opportunityId values
- For each suggestion, reason must name ONE concrete prep action for THAT opportunity (subject skill, document to prepare, or timeline)
- nextSteps must be specific actions tied to the student's gaps (e.g. "Add a STEM project to portfolio" not "Do better")
- Give 1 to 3 practical next steps
- Be encouraging but honest
- Do not invent opportunities, achievements, dates, or facts not in the data
- If the student has weak portfolio coverage, say so and point to a matching opportunity from the list
- Keep language simple for teenagers
- Focus on connecting the student to real opportunities in the list, not generic motivation`;
}

export function buildCVPrompt(
  profileSummary: string,
  activitiesSummary: string,
  cvPlainText: string,
): string {
  return `You are helping a secondary school student in Kathmandu improve their CV text.

STUDENT PROFILE:
${profileSummary}

ACTIVITIES:
${activitiesSummary}

CURRENT CV DRAFT:
${cvPlainText}

Respond with valid JSON only, no markdown, in this exact shape:
{
  "summary": "2-3 sentence professional summary based only on provided facts",
  "bulletPoints": ["improved bullet 1", "improved bullet 2", "..."]
}

Rules:
- Create 4-8 concise CV bullet points from their real activities only
- Do not invent jobs, awards, grades, or experiences not in the data
- Use action verbs and keep bullets under 25 words each
- If they have few activities, write fewer bullets`;
}

export function parseSuggestionsJSON(text: string): AISuggestionResult | null {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AISuggestionResult;

    if (!parsed.explanation || !Array.isArray(parsed.nextSteps)) {
      return null;
    }

    return {
      explanation: parsed.explanation,
      suggestedOpportunities: Array.isArray(parsed.suggestedOpportunities)
        ? parsed.suggestedOpportunities.slice(0, 3)
        : [],
      nextSteps: parsed.nextSteps.slice(0, 3),
    };
  } catch {
    return null;
  }
}

export function parseCVJSON(text: string): AICVEnhancement | null {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as AICVEnhancement;

    if (!parsed.summary || !Array.isArray(parsed.bulletPoints)) {
      return null;
    }

    return {
      summary: parsed.summary,
      bulletPoints: parsed.bulletPoints.slice(0, 10),
    };
  } catch {
    return null;
  }
}
