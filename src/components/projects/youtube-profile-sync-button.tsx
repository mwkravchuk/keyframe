"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  hasYoutubeProfile: boolean;
};

export function YoutubeProfileSyncButton({ hasYoutubeProfile }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (status === "loading") {
      return;
    }

    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/youtube/profile-sync", {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync YouTube profile.");
      }

      setStatus("success");
      setMessage("YouTube profile synced.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Failed to sync YouTube profile.");
    }
  }

  const label = status === "loading"
    ? "Syncing..."
    : hasYoutubeProfile
      ? "Refresh YouTube profile"
      : "Connect YouTube profile";

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="subtle"
        size="sm"
        onClick={handleClick}
        disabled={status === "loading"}
      >
        {label}
      </Button>
      {message ? (
        <p className={`text-[11px] ${status === "error" ? "text-rose-400" : "text-muted-foreground"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
