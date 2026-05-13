"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2 } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface TitleIdeationProps {
  projectId: string;
  concept: string;
  proposedTitles: string[] | null;
  shortlistedTitles: string[];
}

export function TitleIdeation({
  projectId,
  concept,
  proposedTitles: initialProposedTitles,
  shortlistedTitles: initialShortlistedTitles,
}: TitleIdeationProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [titles, setTitles] = useState<string[]>(
    initialProposedTitles || []
  );
  const [shortlistedTitles, setShortlistedTitles] = useState<string[]>(
    initialShortlistedTitles || []
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

      setShortlistedTitles(nextShortlist);
      setError(null);
      router.refresh();
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
          onClick={() => {
            if (!isExpanded) {
              handleGenerate();
            } else {
              setIsExpanded(false);
            }
          }}
          disabled={isLoading}
          variant="ghost"
          size="sm"
          className="ml-auto flex items-center gap-1"
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
        </Button>
      </div>
      <p className="mb-1 ml-6 text-xs text-muted-foreground">
        4-5 compelling titles based on your concept
      </p>
      <p className="mb-3 ml-6 text-xs text-muted-foreground/80">
        Type in &quot;Concept (Your Seed Idea)&quot; and click Generate.
      </p>

      {isExpanded && (
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
                  <span className="flex-1">{title}</span>
                  <Button
                    onClick={() => handleShortlistToggle(title)}
                    variant={shortlistedTitles.includes(title) ? "outline" : "subtle"}
                    size="sm"
                    className={`whitespace-nowrap ${
                      shortlistedTitles.includes(title)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {shortlistedTitles.includes(title) ? "Saved" : "Save"}
                  </Button>
                </div>
              ))}
              <Button
                onClick={handleGenerate}
                disabled={isLoading}
                variant="ghost"
                size="sm"
              >
                Regenerate
              </Button>
            </div>
          ) : (
            <EmptyState compact title="No suggestions yet" description="Generate once to see candidate titles." />
          )}
        </div>
      )}
    </ActionPanel>
  );
}
