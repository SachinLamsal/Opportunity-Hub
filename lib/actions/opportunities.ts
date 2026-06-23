"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SaveState {
  error?: string;
  saved?: boolean;
}

export async function toggleSaveOpportunity(
  opportunityId: string,
): Promise<SaveState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in to save opportunities." };
  }

  const { data: existing } = await supabase
    .from("saved_opportunities")
    .select("id")
    .eq("user_id", user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_opportunities")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${opportunityId}`);
    revalidatePath("/dashboard");
    return { saved: false };
  }

  const { error } = await supabase.from("saved_opportunities").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${opportunityId}`);
  revalidatePath("/dashboard");
  return { saved: true };
}
