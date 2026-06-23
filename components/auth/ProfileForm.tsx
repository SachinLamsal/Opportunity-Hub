"use client";

import { useActionState } from "react";
import { updateProfile, logout, type AuthState } from "@/lib/actions/auth";
import { EDUCATION_LEVELS } from "@/lib/constants";
import type { Profile } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormMessage from "@/components/ui/FormMessage";
import { Card } from "@/components/ui/Card";

const initialState: AuthState = {};

interface ProfileFormProps {
  profile: Profile;
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
        <form action={logout} className="mt-4">
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900">Your profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          Update your details anytime. More fields can be filled in after signup.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <FormMessage error={state.error} success={state.success} />

          <Select
            label="Education level"
            name="education_level"
            options={EDUCATION_LEVELS}
            defaultValue={profile.education_level ?? ""}
          />

          <Input
            label="Dream university"
            name="dream_universities"
            type="text"
            defaultValue={profile.dream_universities ?? ""}
            placeholder="Your target university"
          />

          <Textarea
            label="Subjects"
            name="subjects"
            defaultValue={profile.subjects ?? ""}
            placeholder="e.g. Physics, Mathematics, English"
          />

          <Textarea
            label="Interests"
            name="interests"
            defaultValue={profile.interests ?? ""}
            placeholder="e.g. robotics, debate, music"
          />

          <Textarea
            label="Career interests"
            name="career_interests"
            defaultValue={profile.career_interests ?? ""}
            placeholder="e.g. engineering, medicine, business"
          />

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
