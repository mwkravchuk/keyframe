"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ variant = "sidebar" }: { variant?: "sidebar" | "inline" }) {
  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-sm text-muted-foreground transition hover:text-foreground"
      >
        Sign out
      </button>
    );
  }

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
