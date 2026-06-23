import { createClient } from "@/lib/supabase/server";
import type { Opportunity } from "@/lib/types";

export interface OpportunityFilters {
  q?: string;
  subject?: string;
  type?: string;
  deadline?: string;
  format?: string;
  limit?: number;
}

function getDeadlineRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    today: today.toISOString().split("T")[0],
    weekEnd: endOfWeek.toISOString().split("T")[0],
    monthEnd: endOfMonth.toISOString().split("T")[0],
  };
}

export async function getOpportunities(
  filters: OpportunityFilters = {},
): Promise<Opportunity[]> {
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.subject) {
    query = query.eq("subject_area", filters.subject);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  if (filters.format === "online") {
    query = query.eq("is_online", true);
  } else if (filters.format === "in_person") {
    query = query.eq("is_online", false);
  }

  if (filters.deadline) {
    const { today, weekEnd, monthEnd } = getDeadlineRange();

    if (filters.deadline === "week") {
      query = query.gte("deadline", today).lte("deadline", weekEnd);
    } else if (filters.deadline === "month") {
      query = query.gte("deadline", today).lte("deadline", monthEnd);
    } else if (filters.deadline === "later") {
      query = query.gt("deadline", monthEnd);
    }
  }

  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(
      `title.ilike.${term},description.ilike.${term},organizer.ilike.${term},subject_area.ilike.${term}`,
    );
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch opportunities:", error.message);
    return [];
  }

  return (data ?? []) as Opportunity[];
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch opportunity:", error.message);
    return null;
  }

  return data as Opportunity;
}

export async function getSavedOpportunityIds(): Promise<Set<string>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Set();

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id")
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to fetch saved opportunities:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => row.opportunity_id));
}

export async function getSavedOpportunities(): Promise<Opportunity[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_opportunities")
    .select("opportunity_id, created_at, opportunities (*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch saved opportunities:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.opportunities as unknown as Opportunity)
    .filter(Boolean);
}

export async function isOpportunitySaved(opportunityId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  return !!data;
}
