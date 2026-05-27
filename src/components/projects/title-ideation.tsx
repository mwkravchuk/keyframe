"use client";

import { useState } from "react";
import { Heart, Lightbulb, Loader2 } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface TitleIdeationProps {
  projectId: string;
  concept: string;
  proposedTitles: string[] | null;
  shortlistedTitles: string[];
  isExpanded?: boolean;
  onActivate?: () => void;
  onShortlistedTitlesChange?: (titles: string[]) => void;
}

export function TitleIdeation({
  projectId,
  concept,
  proposedTitles: initialProposedTitles,
  shortlistedTitles,
  isExpanded,
  onActivate,
  onShortlistedTitlesChange,
}: TitleIdeationProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>(
    initialProposedTitles || []
  );
  const [error, setError] = useState<string | null>(null);
  const expanded = isExpanded ?? internalExpanded;
  const hasResults = titles.length > 0;
  const generateButtonClass = `ml-auto flex items-center gap-1 border border-emerald-800 bg-emerald-700 text-emerald-50 hover:bg-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-300/12 dark:text-emerald-100 ${
    isLoading ? "animate-pulse shadow-[0_0_0_1px_rgba(4,120,87,0.5)] dark:shadow-[0_0_0_1px_rgba(167,243,208,0.3)]" : ""
  }`;

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
    onActivate?.();
    setInternalExpanded(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/ideate/titles`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ concept: currentConcept }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate titles");
      }

      const data = await response.json();
      setTitles(data.titles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate titles"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlistToggle = async (title: string) => {
    const isAlreadyShortlisted = shortlistedTitles.includes(title);
    const nextShortlist = isAlreadyShortlisted
      ? shortlistedTitles.filter((item) => item !== title)
      : [...shortlistedTitles, title];

    try {
      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "shortlistedTitles",
          value: nextShortlist,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shortlist");
      }

      onShortlistedTitlesChange?.(nextShortlist);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  return (
    <ActionPanel>
      <div className="mb-2 flex items-baseline gap-2">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Title Ideation
        </h3>
        <Button
          onClick={handleGenerate}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className={generateButtonClass}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating
            </>
          ) : (
            <>
              {hasResults ? "Regenerate" : "Generate"} <span className="opacity-60">→</span>
            </>
          )}
        </Button>
      </div>
      <p className="mb-1 ml-6 text-xs text-muted-foreground">
        4 compelling titles based on your concept
      </p>
      <p className="mb-3 ml-6 text-xs text-muted-foreground/80">
        Type in &quot;Concept (Your Seed Idea)&quot; and click Generate.
      </p>

      {expanded && (
        <div className="ml-6 space-y-2 border-l border-border/70 pl-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating titles...
            </div>
          ) : error ? (
            <div className="text-xs text-destructive">{error}</div>
          ) : titles.length > 0 ? (
            <div className="space-y-2">
              {titles.map((title, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 border-b border-border/60 py-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void handleShortlistToggle(title);
                    }}
                    className="flex-1 cursor-pointer text-left transition hover:text-foreground hover:underline"
                  >
                    {title}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleShortlistToggle(title);
                    }}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-sm transition ${
                      shortlistedTitles.includes(title)
                        ? "text-rose-500 hover:text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground hover:text-rose-500"
                    }`}
                    aria-pressed={shortlistedTitles.includes(title)}
                    aria-label={shortlistedTitles.includes(title) ? "Unsave title" : "Save title"}
                  >
                    <Heart
                      className={shortlistedTitles.includes(title) ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="No suggestions yet" description="Generate once to see candidate titles." />
          )}
        </div>
      )}
    </ActionPanel>
  );
}
