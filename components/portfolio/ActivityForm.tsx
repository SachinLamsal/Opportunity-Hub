"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createActivity, type ActivityState } from "@/lib/actions/activities";
import { useActionRedirect } from "@/components/auth/useActionRedirect";
import { ACTIVITY_CATEGORIES } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import FormMessage from "@/components/ui/FormMessage";
import { Card } from "@/components/ui/Card";

const initialState: ActivityState = {};

export default function ActivityForm() {
  const [state, formAction, pending] = useActionState(createActivity, initialState);
  useActionRedirect(state.redirectTo);

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <h1 className="text-2xl font-bold text-slate-900">Add activity</h1>
      <p className="mt-2 text-sm text-slate-600">
        Log something you&apos;ve done for your portfolio — competitions, clubs,
        volunteering, projects, and more.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <FormMessage error={state.error} success={state.success} />

        <Input
          label="Title"
          name="title"
          type="text"
          required
          placeholder="e.g. School science fair winner"
        />

        <Select
          label="Category"
          name="category"
          options={ACTIVITY_CATEGORIES}
          required
        />

        <Textarea
          label="Description"
          name="description"
          required
          placeholder="What did you do? What was the outcome?"
        />

        <Input
          label="Date"
          name="date"
          type="date"
          required
          defaultValue={today}
          max={today}
        />

        <Textarea
          label="Notes (optional)"
          name="notes"
          placeholder="Any extra details for your CV later"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save activity"}
          </Button>
          <Button href="/portfolio" variant="outline">
            Cancel
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        <Link
          href="/portfolio"
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to portfolio
        </Link>
      </p>
    </Card>
  );
}
