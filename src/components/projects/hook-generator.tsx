"use client";

import { useState } from "react";
import { Heart, Zap, Loader2 } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface HookGeneratorProps {
  projectId: string;
  concept: string;
  projectTitle: string | null;
  shortlistedHooks: string[];
  isExpanded?: boolean;
  onActivate?: () => void;
  onShortlistedHooksChange?: (hooks: string[]) => void;
}

export function HookGenerator({
  projectId,
  concept,
  projectTitle,
  shortlistedHooks,
  isExpanded,
  onActivate,
  onShortlistedHooksChange,
}: HookGeneratorProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const expanded = isExpanded ?? internalExpanded;
  const hasResults = hooks.length > 0;
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

      onShortlistedHooksChange?.(nextShortlist);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  return (
    <ActionPanel>
      <div className="mb-2 flex items-baseline gap-2">
        <Zap className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Hook Generator
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
        First 3 seconds that stops the scroll
      </p>
      <p className="mb-3 ml-6 text-xs text-muted-foreground/80">Generate to review hooks and save what works.</p>

      {expanded && (
        <div className="ml-6 space-y-3 border-l border-border/70 pl-3">
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating hooks...
            </div>
          ) : error ? (
            <div className="text-xs text-destructive">{error}</div>
          ) : hooks.length > 0 ? (
            <div className="space-y-2">
              {hooks.map((hook, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 border-b border-border/60 py-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      void handleShortlistToggle(hook);
                    }}
                    className="flex-1 cursor-pointer text-left transition hover:text-foreground hover:underline"
                  >
                    {hook}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleShortlistToggle(hook);
                    }}
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-sm transition ${
                      shortlistedHooks.includes(hook)
                        ? "text-rose-500 hover:text-rose-600 dark:text-rose-400"
                        : "text-muted-foreground hover:text-rose-500"
                    }`}
                    aria-pressed={shortlistedHooks.includes(hook)}
                    aria-label={shortlistedHooks.includes(hook) ? "Unsave hook" : "Save hook"}
                  >
                    <Heart
                      className={shortlistedHooks.includes(hook) ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="No hooks yet" description="Generate once to see opening line ideas." />
          )}

        </div>
      )}
    </ActionPanel>
  );
}
