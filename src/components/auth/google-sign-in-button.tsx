"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton({ className }: { className?: string }) {
  return (
    <Button
      variant="primary"
      size="md"
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
      className={["mt-8 h-11 w-full gap-2", className].filter(Boolean).join(" ")}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3l3 2.3c1.8-1.7 2.8-4.2 2.8-7.1 0-.7-.1-1.4-.2-2.1H12z"
        />
        <path
          fill="#34A853"
          d="M12 21c2.6 0 4.9-.9 6.5-2.5l-3-2.3c-.8.6-1.9 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2l-3.1 2.4C4.8 18.7 8.1 21 12 21z"
        />
        <path
          fill="#4A90E2"
          d="M6.3 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3.2 6.6C2.4 8.1 2 9.5 2 11s.4 2.9 1.2 4.4L6.3 13z"
        />
        <path
          fill="#FBBC05"
          d="M12 4.8c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 1.9 14.6 1 12 1 8.1 1 4.8 3.3 3.2 6.6L6.3 9C7.1 6.6 9.3 4.8 12 4.8z"
        />
      </svg>
      Continue with Google
    </Button>
  );
}
