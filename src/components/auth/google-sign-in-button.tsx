"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() =>
        signIn(
          "google",
          { callbackUrl: "/projects" },
          {
            prompt: "select_account consent",
            scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
            access_type: "offline",
            include_granted_scopes: "false",
          },
        )
      }
      className="mt-8 w-full rounded-sm bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
    >
      Continue with Google
    </button>
  );
}
