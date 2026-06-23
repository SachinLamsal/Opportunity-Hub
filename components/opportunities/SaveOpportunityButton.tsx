"use client";

import { useState, useTransition } from "react";
import { toggleSaveOpportunity } from "@/lib/actions/opportunities";
import Button from "@/components/ui/Button";

interface SaveOpportunityButtonProps {
  opportunityId: string;
  initialSaved: boolean;
  size?: "sm" | "md";
}

export default function SaveOpportunityButton({
  opportunityId,
  initialSaved,
  size = "md",
}: SaveOpportunityButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleSaveOpportunity(opportunityId);

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.saved !== undefined) {
        setSaved(result.saved);
      }
    });
  }

  return (
    <Button
      type="button"
      variant={saved ? "primary" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      aria-label={saved ? "Unsave opportunity" : "Save opportunity"}
      className="shrink-0"
    >
      {isPending ? "…" : saved ? "Saved ✓" : "Save"}
    </Button>
  );
}
