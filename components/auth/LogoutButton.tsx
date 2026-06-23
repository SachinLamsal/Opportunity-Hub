"use client";

import { useFormStatus } from "react-dom";
import { logout } from "@/lib/actions/auth";
import Button from "@/components/ui/Button";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="ghost" size="sm" disabled={pending}>
      {pending ? "…" : "Log out"}
    </Button>
  );
}
