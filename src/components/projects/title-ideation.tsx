"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Loader2, Check } from "lucide-react";

interface TitleIdeationProps {
  projectId: string;
  projectTitle: string;
  concept: string;
  selectedTitle: string | null;
  proposedTitles: string[] | null;
  shortlistedTitles: string[];
}

export function TitleIdeation({
  projectId,
  projectTitle,
  concept,
  selectedTitle,
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
  const [saved, setSaved] = useState(selectedTitle || null);
  const [currentProjectTitle, setCurrentProjectTitle] = useState(projectTitle);
  const [isApplyingTitle, setIsApplyingTitle] = useState(false);
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

  const handleSaveTitle = async (title: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/selections`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "selectedTitle",
            value: title,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save selection");
      }

      setSaved(title);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save selection"
      );
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  const handleUseAsProjectTitle = async (title: string) => {
    setIsApplyingTitle(true);
    setError(null);

    try {
      const [titleResponse, selectedResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "title",
            value: title,
          }),
        }),
        fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "selectedTitle",
            value: title,
          }),
        }),
      ]);

      if (!titleResponse.ok || !selectedResponse.ok) {
        throw new Error("Failed to apply project title");
      }

      setSaved(title);
      setCurrentProjectTitle(title);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply project title");
    } finally {
      setIsApplyingTitle(false);
    }
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Title Ideation
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
        4-5 compelling titles based on your concept
      </p>
      <p className="text-xs text-muted-foreground/80 ml-6 mb-3">
        Type in &quot;Concept (Your Seed Idea)&quot; and click Generate.
      </p>

      {isExpanded && (
        <div className="ml-6 space-y-2 rounded border border-border/50 bg-card/20 p-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating titles...
            </div>
          ) : error ? (
            <div className="text-xs text-red-500">{error}</div>
          ) : titles.length > 0 ? (
            <div className="space-y-2">
              {titles.map((title, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded border border-border/30 bg-background px-2 py-1.5 text-xs"
                >
                  <span className="flex-1">{title}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleShortlistToggle(title)}
                      className={`whitespace-nowrap px-2 py-0.5 rounded transition text-xs ${
                        shortlistedTitles.includes(title)
                          ? "bg-accent/20 text-accent"
                          : "bg-border/20 text-muted-foreground hover:bg-border/40"
                      }`}
                    >
                      {shortlistedTitles.includes(title) ? "Saved" : "Save"}
                    </button>
                    <button
                      onClick={() => handleSaveTitle(title)}
                      disabled={saved === title}
                      className={`flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded transition text-xs ${
                        saved === title
                          ? "bg-accent/20 text-accent"
                          : "bg-border/20 text-muted-foreground hover:bg-border/40"
                      }`}
                    >
                      {saved === title ? (
                        <>
                          <Check className="h-3 w-3" />
                          Selected
                        </>
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
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
