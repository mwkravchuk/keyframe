"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/projects" })}
      className="mt-8 w-full rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
    >
      Continue with Google
    </button>
  );
}
