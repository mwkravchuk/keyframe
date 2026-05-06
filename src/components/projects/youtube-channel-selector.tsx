"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ChannelOption = {
  channelId: string;
  title: string | null;
  isActive: boolean;
};

type Props = {
  channels: ChannelOption[];
};

export function YoutubeChannelSelector({ channels }: Props) {
  const router = useRouter();
  const activeChannelId = useMemo(
    () => channels.find((channel) => channel.isActive)?.channelId ?? channels[0]?.channelId ?? "",
    [channels],
  );

  const [selectedChannelId, setSelectedChannelId] = useState(activeChannelId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextChannelId: string) {
    setSelectedChannelId(nextChannelId);
    setError(null);

    if (!nextChannelId || nextChannelId === activeChannelId || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/youtube/channels/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId: nextChannelId }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to switch channel.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch channel.");
      setSelectedChannelId(activeChannelId);
    } finally {
      setIsSaving(false);
    }
  }

  if (channels.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label htmlFor="youtube-channel" className="text-[11px] text-muted-foreground">
        Active YouTube channel
      </label>
      <select
        id="youtube-channel"
        value={selectedChannelId}
        onChange={(event) => {
          void handleChange(event.target.value);
        }}
        disabled={isSaving}
        className="w-56 rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground"
      >
        {channels.map((channel) => (
          <option key={channel.channelId} value={channel.channelId}>
            {channel.title?.trim() || channel.channelId}
          </option>
        ))}
      </select>
      {error ? <p className="text-[11px] text-rose-400">{error}</p> : null}
    </div>
  );
}
