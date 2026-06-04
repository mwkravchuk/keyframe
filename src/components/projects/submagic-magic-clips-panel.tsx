"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type SubmagicClip = {
  id: string;
  title: string;
  status: string;
  duration: number | null;
  previewUrl: string | null;
  downloadUrl: string | null;
  directUrl: string | null;
  viralityTotal: number | null;
};

type SubmagicData = {
  id: string;
  status: string;
  previewUrl: string | null;
  downloadUrl: string | null;
  directUrl: string | null;
  failureReason: string | null;
  updatedAt: string | null;
  magicClips: SubmagicClip[];
};

type Props = {
  projectId: string;
  hasYoutubeVideoUrl: boolean;
  initialStatus: string | null;
  initialData: SubmagicData | null;
};

function getClipPlaybackUrl(clip: SubmagicClip) {
  return clip.directUrl || clip.previewUrl || clip.downloadUrl || null;
}

export function SubmagicMagicClipsPanel({
  projectId,
  hasYoutubeVideoUrl,
  initialStatus,
  initialData,
}: Props) {
  const [status, setStatus] = useState(initialStatus ?? "idle");
  const [data, setData] = useState<SubmagicData | null>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clips = useMemo(() => data?.magicClips ?? [], [data]);

  async function generateMagicClips() {
    if (!hasYoutubeVideoUrl || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/submagic/magic-clips`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "en",
          minClipLength: 15,
          maxClipLength: 60,
          faceTracking: true,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        status?: string;
        data?: SubmagicData;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to create Magic Clips project.");
      }

      if (payload.status) {
        setStatus(payload.status);
      }
      if (payload.data) {
        setData(payload.data);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create Magic Clips project.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function refreshStatus() {
    if (isRefreshing || !data?.id) {
      return;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/submagic/sync`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
        status?: string;
        data?: SubmagicData;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to refresh Submagic status.");
      }

      if (payload.status) {
        setStatus(payload.status);
      }
      if (payload.data) {
        setData(payload.data);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to refresh Submagic status.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <section className="space-y-4 rounded-md border border-border/70 bg-card/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Submagic Magic Clips</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate short clips from your linked YouTube video URL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refreshStatus();
            }}
            disabled={isRefreshing || !data?.id}
          >
            {isRefreshing ? "Refreshing..." : "Refresh status"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              void generateMagicClips();
            }}
            disabled={!hasYoutubeVideoUrl || isGenerating}
          >
            {isGenerating ? "Starting..." : "Generate clips"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Status: <span className="font-medium text-foreground">{status}</span>
        {!hasYoutubeVideoUrl ? " (add a YouTube URL first)" : ""}
      </div>

      {data?.failureReason ? (
        <p className="text-xs text-destructive">Failure: {data.failureReason}</p>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {clips.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 md:grid-cols-3 xl:grid-cols-5">
          {clips.map((clip) => {
            const playbackUrl = getClipPlaybackUrl(clip);

            return (
              <div key={clip.id} className="mx-auto w-full max-w-55 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium text-foreground line-clamp-2">{clip.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{clip.viralityTotal ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{clip.status}</span>
                  {clip.downloadUrl ? (
                    <a
                      href={clip.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Download ${clip.title}`}
                      title="Download clip"
                      className="rounded border border-border/80 p-1 text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
                    >
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M8 2.5v7" strokeLinecap="round" />
                        <path d="m5.5 7.5 2.5 2.75L10.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 12.5h10" strokeLinecap="round" />
                      </svg>
                    </a>
                  ) : null}
                </div>
                {playbackUrl ? (
                  <div className="overflow-hidden rounded border border-border/70 bg-black">
                    <video
                      className="aspect-9/16 w-full object-contain"
                      controls
                      preload="metadata"
                      src={playbackUrl}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-9/16 items-center justify-center rounded border border-dashed border-border/70 bg-muted/20 text-[10px] text-muted-foreground">
                    No preview URL
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No clips yet.</p>
      )}
    </section>
  );
}
