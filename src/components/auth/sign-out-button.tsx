"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton({ variant = "sidebar" }: { variant?: "sidebar" | "inline" | "icon" }) {
  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label="Sign out"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition hover:text-foreground"
      >
        <LogOut size={16} />
      </button>
    );
  }

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
      className="w-full rounded-sm border border-border px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      Sign out
    </button>
  );
}
