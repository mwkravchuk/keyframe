"use client";

import { useState } from "react";
import { Zap, Loader2 } from "lucide-react";

interface HookGeneratorProps {
  projectId: string;
  concept: string;
  projectTitle: string | null;
  shortlistedHooks: string[];
}

export function HookGenerator({
  projectId,
  concept,
  projectTitle,
  shortlistedHooks: initialShortlistedHooks,
}: HookGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [shortlistedHooks, setShortlistedHooks] = useState<string[]>(
    initialShortlistedHooks || []
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
        `/api/projects/${projectId}/ideate/hooks`,
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
        throw new Error("Failed to generate hooks");
      }

      const data = await response.json();
      setHooks(data.hooks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate hooks"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShortlistToggle = async (hook: string) => {
    const isAlreadyShortlisted = shortlistedHooks.includes(hook);
    const nextShortlist = isAlreadyShortlisted
      ? shortlistedHooks.filter((item) => item !== hook)
      : [...shortlistedHooks, hook];

    try {
      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "shortlistedHooks",
          value: nextShortlist,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update shortlist");
      }

      setShortlistedHooks(nextShortlist);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Hook Generator
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
        First 3 seconds that stops the scroll
      </p>

      {isExpanded && (
        <div className="ml-6 space-y-2 rounded border border-border/50 bg-card/20 p-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating hooks...
            </div>
          ) : error ? (
            <div className="text-xs text-red-500">{error}</div>
          ) : hooks.length > 0 ? (
            <div className="space-y-2">
              {hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 rounded border border-border/30 bg-background px-2 py-1.5 text-xs"
                >
                  <span className="flex-1">{hook}</span>
                  <button
                    onClick={() => handleShortlistToggle(hook)}
                    className={`whitespace-nowrap px-2 py-0.5 rounded transition text-xs ${
                      shortlistedHooks.includes(hook)
                        ? "bg-accent/20 text-accent"
                        : "bg-border/20 text-muted-foreground hover:bg-border/40"
                    }`}
                  >
                    {shortlistedHooks.includes(hook) ? "Saved" : "Save"}
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
