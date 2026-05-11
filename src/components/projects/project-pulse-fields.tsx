"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoProjectStage } from "@prisma/client";
import { ProjectPulseStagePicker } from "@/components/projects/project-pulse-stage-picker";

type Channel = {
  channelId: string;
  title: string | null;
  avatarUrl: string | null;
};

interface ProjectPulseFieldsProps {
  projectId: string;
  initialStage: VideoProjectStage;
  initialTargetPublishAt: string;
  initialYoutubeChannelId: string | null;
  channels: Channel[];
}

function parseLocalDateFromInput(value: string) {
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function ProjectPulseFields({
  projectId,
  initialStage,
  initialTargetPublishAt,
  initialYoutubeChannelId,
  channels,
}: ProjectPulseFieldsProps) {
  const [targetPublishAt, setTargetPublishAt] = useState(initialTargetPublishAt);
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialYoutubeChannelId ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const localTargetDate = targetPublishAt ? parseLocalDateFromInput(targetPublishAt) : null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const daysUntilPublish = localTargetDate
    ? Math.round((localTargetDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const publishCountdownLabel = daysUntilPublish == null
    ? "No target date"
    : daysUntilPublish > 0
      ? `${daysUntilPublish} days left`
      : daysUntilPublish === 0
        ? "Publishes today"
        : `${Math.abs(daysUntilPublish)} days overdue`;

  const publishCountdownClass = daysUntilPublish == null
    ? "bg-border/40 text-muted-foreground"
    : daysUntilPublish < 0
      ? "bg-red-500/15 text-red-700"
      : daysUntilPublish <= 3
        ? "bg-amber-500/20 text-amber-700"
        : "bg-emerald-500/20 text-emerald-700";

  const lastSavedRef = useRef({
    targetPublishAt: initialTargetPublishAt,
    youtubeChannelId: initialYoutubeChannelId ?? "",
  });

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const hasChanges =
      targetPublishAt !== lastSavedRef.current.targetPublishAt ||
      youtubeChannelId !== lastSavedRef.current.youtubeChannelId;

    if (!hasChanges) {
      setError(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const updates: Array<{ field: string; value: string | null }> = [];

      if (targetPublishAt !== lastSavedRef.current.targetPublishAt) {
        updates.push({ field: "targetPublishAt", value: targetPublishAt || null });
      }

      if (youtubeChannelId !== lastSavedRef.current.youtubeChannelId) {
        updates.push({ field: "youtubeChannelId", value: youtubeChannelId || null });
      }

      if (updates.length === 0) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        await Promise.all(
          updates.map((update) =>
            fetch(`/api/projects/${projectId}/selections`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            }).then((response) => {
              if (!response.ok) {
                throw new Error("Failed to save");
              }
            }),
          ),
        );

        lastSavedRef.current = {
          targetPublishAt,
          youtubeChannelId,
        };
      } catch {
        setError("Failed to save");
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, targetPublishAt, youtubeChannelId]);

  return (
    <>

      <div className="mt-4 space-y-4">
        <div>
          <ProjectPulseStagePicker
            projectId={projectId}
            initialStage={initialStage}
          />
        </div>

        <div>
          <div className="flex justify-between items-center">
            <label htmlFor="targetPublishAt" className="text-xs font-semibold uppercase tracking-wide text-foreground">
              Target Publish Date
            </label>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${publishCountdownClass}`}>
              {publishCountdownLabel}
            </span>
          </div>
          <input
            id="targetPublishAt"
            name="targetPublishAt"
            type="date"
            value={targetPublishAt}
            onChange={(event) => setTargetPublishAt(event.target.value)}
            className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            YouTube Channel
          </p>
          <div className="mt-2 space-y-1.5 rounded-sm border border-border bg-background p-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-xs text-muted-foreground transition hover:bg-muted/40 hover:text-foreground">
              <input
                type="radio"
                name="youtubeChannelId"
                value=""
                checked={!youtubeChannelId}
                onChange={() => setYoutubeChannelId("")}
                className="h-3.5 w-3.5"
              />
              <span>No channel assigned</span>
            </label>
            {channels.map((c) => {
              const channelInitial = (c.title?.trim()?.[0] ?? "Y").toUpperCase();
              return (
                <label
                  key={c.channelId}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-xs text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                >
                  <input
                    type="radio"
                    name="youtubeChannelId"
                    value={c.channelId}
                    checked={youtubeChannelId === c.channelId}
                    onChange={() => setYoutubeChannelId(c.channelId)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-[9px] font-semibold text-muted-foreground">
                    {c.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.avatarUrl}
                        alt={c.title ?? "YouTube channel avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{channelInitial}</span>
                    )}
                  </span>
                  <span className="truncate">{c.title ?? c.channelId}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 h-4 text-[11px] text-muted-foreground">
        {isSaving ? "Saving pulse..." : error ?? "Pulse saved automatically"}
      </div>
    </>
  );
}
