"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      Sign out
    </button>
  );
}
