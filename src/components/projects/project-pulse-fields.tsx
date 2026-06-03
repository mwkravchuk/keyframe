"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoProjectStage } from "@prisma/client";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";
import { getYoutubeThumbnailUrl, getYoutubeVideoId } from "@/lib/youtube-video";
import { FieldLabel, Input } from "@/components/ui/field";

const STAGE_CHIP_STYLES: Record<VideoProjectStage, string> = {
  IDEA: "border-sky-400/35 bg-sky-400/14 text-sky-700 dark:text-sky-300",
  DRAFTING: "border-violet-400/35 bg-violet-400/14 text-violet-700 dark:text-violet-300",
  RECORDING: "border-blue-400/35 bg-blue-400/14 text-blue-700 dark:text-blue-300",
  EDITING: "border-indigo-400/35 bg-indigo-400/14 text-indigo-700 dark:text-indigo-300",
  PUBLISHED: "border-emerald-400/35 bg-emerald-400/14 text-emerald-700 dark:text-emerald-300",
  REVIEW: "border-amber-400/35 bg-amber-400/14 text-amber-700 dark:text-amber-300",
};

type Channel = {
  channelId: string;
  title: string | null;
  avatarUrl: string | null;
};

type YoutubeVideoSummary = {
  videoId: string;
  title: string;
  publishedAt: string | null;
  thumbnailUrl: string | null;
  url: string;
};

interface ProjectPulseFieldsProps {
  projectId: string;
  initialStage: VideoProjectStage;
  initialTargetPublishAt: string;
  initialYoutubeChannelId: string | null;
  initialYoutubeVideoUrl: string;
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
  initialYoutubeVideoUrl,
  channels,
}: ProjectPulseFieldsProps) {
  const [stage, setStage] = useState<VideoProjectStage>(initialStage);
  const [targetPublishAt, setTargetPublishAt] = useState(initialTargetPublishAt);
  const [youtubeChannelId, setYoutubeChannelId] = useState(initialYoutubeChannelId ?? "");
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState(initialYoutubeVideoUrl);
  const [videos, setVideos] = useState<YoutubeVideoSummary[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState("");
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  const youtubeVideoId = getYoutubeVideoId(youtubeVideoUrl);
  const youtubeThumbnailUrl = getYoutubeThumbnailUrl(youtubeVideoUrl);

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
    youtubeVideoUrl: initialYoutubeVideoUrl,
  });

  useEffect(() => {
    const controller = new AbortController();
    const selectedChannelId = youtubeChannelId.trim();

    if (!selectedChannelId) {
      return;
    }

    async function loadVideos() {
      setIsLoadingVideos(true);
      setVideosError(null);

      try {
        const response = await fetch(
          `/api/youtube/videos?channelId=${encodeURIComponent(selectedChannelId)}&limit=12`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error || "Failed to load videos.");
        }

        const payload = (await response.json()) as { videos?: YoutubeVideoSummary[] };
        setVideos(payload.videos ?? []);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setVideos([]);
        setVideosError(error instanceof Error ? error.message : "Failed to load videos.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingVideos(false);
        }
      }
    }

    void loadVideos();

    return () => {
      controller.abort();
    };
  }, [youtubeChannelId]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const hasChanges =
      stage !== lastSavedRef.current.stage ||
      targetPublishAt !== lastSavedRef.current.targetPublishAt ||
      youtubeChannelId !== lastSavedRef.current.youtubeChannelId ||
      youtubeVideoUrl !== lastSavedRef.current.youtubeVideoUrl;

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

      if (youtubeVideoUrl !== lastSavedRef.current.youtubeVideoUrl) {
        updates.push(
          fetch(`/api/projects/${projectId}/selections`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field: "youtubeVideoUrl", value: youtubeVideoUrl || null }),
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
          youtubeVideoUrl,
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
  }, [projectId, stage, targetPublishAt, youtubeChannelId, youtubeVideoUrl]);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Stage</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Stage">
            {VIDEO_PROJECT_STAGES.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={stage === item}
                onClick={() => setStage(item)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  stage === item
                    ? STAGE_CHIP_STYLES[item]
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {VIDEO_PROJECT_STAGE_LABELS[item]}
              </button>
            ))}
          </div>
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
            onChange={(event) => {
              setYoutubeChannelId(event.target.value);
              setVideos([]);
              setSelectedVideoUrl("");
              setVideosError(null);
            }}
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <FieldLabel htmlFor="youtubeVideoUrl">Long-form YouTube URL</FieldLabel>
          <Input
            id="youtubeVideoUrl"
            name="youtubeVideoUrl"
            type="url"
            value={youtubeVideoUrl}
            onChange={(event) => {
              setYoutubeVideoUrl(event.target.value);
              setSelectedVideoUrl("");
            }}
            className="mt-2"
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>

        <div>
          <FieldLabel htmlFor="youtubeVideoPicker">Pick from recent channel videos</FieldLabel>
          <select
            id="youtubeVideoPicker"
            value={selectedVideoUrl}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSelectedVideoUrl(nextValue);
              if (nextValue) {
                setYoutubeVideoUrl(nextValue);
              }
            }}
            disabled={!youtubeChannelId || isLoadingVideos}
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
          >
            <option value="">
              {youtubeChannelId
                ? isLoadingVideos
                  ? "Loading recent videos..."
                  : "Select a recent video"
                : "Select a channel first"}
            </option>
            {videos.map((video) => (
              <option key={video.videoId} value={video.url}>
                {video.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {videosError
              ? videosError
              : youtubeChannelId && !isLoadingVideos && videos.length === 0
                ? "No recent videos found for this channel."
                : "Choose a past upload to auto-fill the URL field."}
          </p>
        </div>
      </div>

      {youtubeThumbnailUrl ? (
        <div className="mt-3">
          <a
            href={youtubeVideoId ? `https://www.youtube.com/watch?v=${youtubeVideoId}` : youtubeVideoUrl}
            target="_blank"
            rel="noreferrer"
            className="block max-w-sm overflow-hidden rounded-md border border-border bg-card transition hover:border-foreground/35"
            title="Open video on YouTube"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumbnailUrl}
              alt="YouTube video thumbnail"
              className="h-40 w-full object-cover"
              loading="lazy"
            />
            <div className="border-t border-border/70 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              Linked long-form video preview
            </div>
          </a>
        </div>
      ) : null}

      <div className="mt-2 h-4 text-[11px] text-muted-foreground">
        {isSaving ? "Saving pulse..." : error ?? "Pulse saved automatically"}
      </div>
    </>
  );
}
