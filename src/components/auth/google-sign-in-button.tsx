"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/app" })}
      className="mt-8 w-full rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
    >
      Continue with Google
    </button>
  );
}
