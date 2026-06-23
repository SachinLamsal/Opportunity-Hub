"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/lib/actions/auth";
import { useActionRedirect } from "@/components/auth/useActionRedirect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormMessage from "@/components/ui/FormMessage";
import { Card } from "@/components/ui/Card";

const initialState: AuthState = {};

interface LoginFormProps {
  authError?: string;
}

export default function LoginForm({ authError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState);
  useActionRedirect(state.redirectTo);

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-600">
        Log in to your OpportunityHub account.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormMessage error={authError ?? state.error} />

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
          autoComplete="current-password"
          required
          placeholder="Your password"
        />

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
          Sign up
        </Link>
      </p>
    </Card>
  );
}
