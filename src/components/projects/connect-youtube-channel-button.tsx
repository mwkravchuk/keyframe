"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

type Props = {
  callbackUrl?: string;
};

export function ConnectYoutubeChannelButton({ callbackUrl = "/projects?link=1" }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/youtube/link-context", {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to prepare channel linking.");
      }

      await signIn(
        "google",
        { callbackUrl },
        {
          prompt: "select_account consent",
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          include_granted_scopes: "false",
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect another channel.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="rounded-sm border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Opening Google..." : "Connect another channel"}
      </button>
      {error ? <p className="text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
}
