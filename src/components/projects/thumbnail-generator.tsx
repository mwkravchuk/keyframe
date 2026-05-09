"use client";

import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";
import type { ThumbnailDirectionOption } from "@/lib/ai";

interface ThumbnailGeneratorProps {
  projectId: string;
  concept: string;
  projectTitle: string | null;
  shortlistedThumbnailDirections: ThumbnailDirectionOption[];
}

export function ThumbnailGenerator({
  projectId,
  concept,
  projectTitle,
  shortlistedThumbnailDirections: initialShortlistedThumbnailDirections,
}: ThumbnailGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnails, setThumbnails] = useState<ThumbnailDirectionOption[]>([]);
  const [shortlistedThumbnails, setShortlistedThumbnails] = useState<ThumbnailDirectionOption[]>(
    initialShortlistedThumbnailDirections || []
  );
  const [error, setError] = useState<string | null>(null);

  const getLiveConcept = () => {
    const conceptField = document.getElementById("concept") as HTMLTextAreaElement | null;
    const liveValue = conceptField?.value?.trim() ?? "";
    return liveValue || concept.trim();
  };

  const handleGenerate = async () => {
    const currentConcept = getLiveConcept();

    if (!currentConcept) {
      setError("Please write a concept first");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsExpanded(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/ideate/thumbnail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            concept: currentConcept,
            title: projectTitle,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate thumbnail directions");
      }

      const data = await response.json();
      setThumbnails(data.thumbnails || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate thumbnail directions"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const serializeThumbnail = (thumbnail: ThumbnailDirectionOption) => JSON.stringify(thumbnail);

  const handleShortlistToggle = async (thumbnail: ThumbnailDirectionOption) => {
    const thumbnailKey = serializeThumbnail(thumbnail);
    const isAlreadyShortlisted = shortlistedThumbnails.some((item) => serializeThumbnail(item) === thumbnailKey);
    const nextShortlist = isAlreadyShortlisted
      ? shortlistedThumbnails.filter((item) => serializeThumbnail(item) !== thumbnailKey)
      : [...shortlistedThumbnails, thumbnail];

    try {
      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "shortlistedThumbnailDirection",
          value: nextShortlist,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shortlist");
      }

      setShortlistedThumbnails(nextShortlist);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Thumbnail Direction
        </h3>
        <button
          onClick={() => {
            if (!isExpanded) {
              handleGenerate();
            } else {
              setIsExpanded(false);
            }
          }}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-accent transition hover:opacity-80 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </>
          ) : isExpanded ? (
            "Close"
          ) : (
            <>
              Generate <span className="opacity-60">→</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-muted-foreground ml-6 mb-3">
        Visual hook ideas and composition suggestions
      </p>

      {isExpanded && (
        <div className="ml-6 space-y-2 rounded border border-border/50 bg-card/20 p-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating thumbnail directions...
            </div>
          ) : error ? (
            <div className="text-xs text-red-500">{error}</div>
          ) : thumbnails.length > 0 ? (
            <div className="space-y-2">
              {thumbnails.map((thumbnail, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded border border-border/30 bg-background px-2 py-1.5 text-xs"
                >
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground break-words">
                      {thumbnail.mainVisualElement}
                    </p>
                    <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground">
                      <p><span className="font-semibold text-foreground">Color palette:</span> {thumbnail.colorPalette || "-"}</p>
                      <p><span className="font-semibold text-foreground">Composition:</span> {thumbnail.composition || "-"}</p>
                      <p><span className="font-semibold text-foreground">Text overlay:</span> {thumbnail.textOverlay || "-"}</p>
                      <p><span className="font-semibold text-foreground">Tone:</span> {thumbnail.emotionalTone || "-"}</p>
                      <p><span className="font-semibold text-foreground">Style:</span> {thumbnail.referenceStyle || "-"}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleShortlistToggle(thumbnail)}
                    disabled={isLoading}
                    className={`whitespace-nowrap px-2 py-0.5 rounded transition text-xs ${
                      shortlistedThumbnails.some((item) => serializeThumbnail(item) === serializeThumbnail(thumbnail))
                        ? "bg-accent/20 text-accent"
                        : "bg-border/20 text-muted-foreground hover:bg-border/40"
                    }`}
                  >
                    {shortlistedThumbnails.some((item) => serializeThumbnail(item) === serializeThumbnail(thumbnail)) ? "Saved" : "Save"}
                  </button>
                </div>
              ))}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="mt-2 text-xs text-muted-foreground transition hover:text-accent disabled:opacity-50"
              >
                Regenerate
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
