"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ variant = "sidebar" }: { variant?: "sidebar" | "inline" | "icon" }) {
  if (variant === "icon") {
    return (
      <Button
        size="icon"
        variant="outline"
        aria-label="Sign out"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="text-muted-foreground hover:text-foreground"
      >
        <LogOut size={16} />
      </Button>
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
    <Button
      variant="subtle"
      size="md"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full justify-start"
    >
      Sign out
    </Button>
  );
}
