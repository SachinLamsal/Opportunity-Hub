"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type AuthState } from "@/lib/actions/auth";
import { useActionRedirect } from "@/components/auth/useActionRedirect";
import { EDUCATION_LEVELS } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import FormMessage from "@/components/ui/FormMessage";
import { Card } from "@/components/ui/Card";

const initialState: AuthState = {};

export default function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-2 text-sm text-slate-600">
        Start building your university portfolio today.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormMessage error={state.error} success={state.success} />

        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          placeholder="At least 6 characters"
        />

        <Select
          label="Education level"
          name="education_level"
          options={EDUCATION_LEVELS}
          required
        />

        <Input
          label="Dream university"
          name="dream_university"
          type="text"
          required
          placeholder="e.g. TU, Kathmandu University, abroad…"
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
          Log in
        </Link>
      </p>
    </Card>
  );
}
