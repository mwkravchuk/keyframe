"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoProjectStage } from "@prisma/client";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";
import { FieldLabel, Input } from "@/components/ui/field";

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
  const [stage, setStage] = useState<VideoProjectStage>(initialStage);
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
      ? "bg-red-500/15 text-red-700 dark:text-red-300"
      : daysUntilPublish <= 3
        ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
        : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";

  const lastSavedRef = useRef({
    stage: initialStage,
    targetPublishAt: initialTargetPublishAt,
    youtubeChannelId: initialYoutubeChannelId ?? "",
  });

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const hasChanges =
      stage !== lastSavedRef.current.stage ||
      targetPublishAt !== lastSavedRef.current.targetPublishAt ||
      youtubeChannelId !== lastSavedRef.current.youtubeChannelId;

    if (!hasChanges) {
      setError(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const updates: Array<Promise<void>> = [];

      if (stage !== lastSavedRef.current.stage) {
        updates.push(
          fetch(`/api/projects/${projectId}/stage`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stage }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to save");
            }
          }),
        );
      }

      if (targetPublishAt !== lastSavedRef.current.targetPublishAt) {
        updates.push(
          fetch(`/api/projects/${projectId}/selections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: "targetPublishAt", value: targetPublishAt || null }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to save");
            }
          }),
        );
      }

      if (youtubeChannelId !== lastSavedRef.current.youtubeChannelId) {
        updates.push(
          fetch(`/api/projects/${projectId}/selections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: "youtubeChannelId", value: youtubeChannelId || null }),
          }).then((response) => {
            if (!response.ok) {
              throw new Error("Failed to save");
            }
          }),
        );
      }

      if (updates.length === 0) {
        return;
      }

      setIsSaving(true);
      setError(null);

      try {
        await Promise.all(updates);

        lastSavedRef.current = {
          stage,
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
  }, [projectId, stage, targetPublishAt, youtubeChannelId]);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <FieldLabel htmlFor="stage">Stage</FieldLabel>
          <select
            id="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as VideoProjectStage)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {VIDEO_PROJECT_STAGES.map((item) => (
              <option key={item} value={item}>
                {VIDEO_PROJECT_STAGE_LABELS[item]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="targetPublishAt">Target Publish Date</FieldLabel>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${publishCountdownClass}`}>
              {publishCountdownLabel}
            </span>
          </div>
          <Input
            id="targetPublishAt"
            name="targetPublishAt"
            type="date"
            value={targetPublishAt}
            onChange={(event) => setTargetPublishAt(event.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <FieldLabel htmlFor="youtubeChannelId">YouTube Channel</FieldLabel>
          <select
            id="youtubeChannelId"
            value={youtubeChannelId}
            onChange={(event) => setYoutubeChannelId(event.target.value)}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">No channel assigned</option>
            {channels.map((channel) => (
              <option key={channel.channelId} value={channel.channelId}>
                {channel.title ?? channel.channelId}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 h-4 text-[11px] text-muted-foreground">
        {isSaving ? "Saving pulse..." : error ?? "Pulse saved automatically"}
      </div>
    </>
  );
}
