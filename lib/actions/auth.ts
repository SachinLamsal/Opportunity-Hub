"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";
import type { EducationLevel } from "@/lib/types";

export interface AuthState {
  error?: string;
  success?: string;
  /** Set instead of calling redirect() — useActionState cannot handle redirect throws. */
  redirectTo?: string;
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const educationLevel = formData.get("education_level") as EducationLevel;
  const dreamUniversity = (formData.get("dream_university") as string)?.trim();

  if (!email || !password || !educationLevel || !dreamUniversity) {
    return { error: "Please fill in all fields." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  if (!hasSupabaseEnv()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const supabase = await createClient();

  let data;
  let error;

  try {
    ({ data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          education_level: educationLevel,
          dream_universities: dreamUniversity,
        },
      },
    }));
  } catch {
    return {
      error:
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local and your network connection.",
    };
  }

  if (error) {
    return { error: error.message };
  }

  if (!data.user) {
    return { error: "Could not create account. Please try again." };
  }

  // When email confirmation is off, we have a session and can upsert directly.
  // When confirmation is on, the DB trigger creates the profile from auth metadata.
  if (data.session) {
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email,
        education_level: educationLevel,
        dream_universities: dreamUniversity,
      },
      { onConflict: "id" },
    );

    if (profileError) {
      return {
        error: `Account created but profile save failed: ${profileError.message}. Run supabase/complete-schema.sql in the Supabase SQL Editor.`,
      };
    }
  }

  if (!data.session) {
    return {
      success:
        "Account created! Check your email to confirm, then log in.",
    };
  }

  revalidatePath("/", "layout");
  return { redirectTo: "/dashboard" };
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  if (!hasSupabaseEnv()) {
    return {
      error:
        "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const supabase = await createClient();

  let error;

  try {
    ({ error } = await supabase.auth.signInWithPassword({
      email,
      password,
    }));
  } catch {
    return {
      error:
        "Could not reach Supabase. Check NEXT_PUBLIC_SUPABASE_URL in .env.local and your network connection.",
    };
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { redirectTo: "/dashboard" };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function updateProfile(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be logged in." };
  }

  const educationLevel = formData.get("education_level") as string;
  const dreamUniversities = (formData.get("dream_universities") as string)?.trim();
  const subjects = (formData.get("subjects") as string)?.trim() || null;
  const interests = (formData.get("interests") as string)?.trim() || null;
  const careerInterests = (formData.get("career_interests") as string)?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      education_level: educationLevel || null,
      dream_universities: dreamUniversities || null,
      subjects,
      interests,
      career_interests: careerInterests,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: "Profile updated successfully." };
}

export async function getProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }

  return profile;
}
