"use client";

import { useState } from "react";
import { Heart, ListChecks, Loader2 } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface ScenePlannerGeneratorProps {
  projectId: string;
  initialValue: string;
  isExpanded?: boolean;
  onActivate?: () => void;
  onSavedScenesChange?: (scenes: string[]) => void;
}

function parseSavedScenes(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const checklistMatch = line.match(/^[-*]\s*\[(x| )\]\s*(.+)$/i);
      if (checklistMatch) {
        return checklistMatch[2].trim();
      }

      return line.replace(/^[-*]\s*/, "").trim();
    })
    .filter(Boolean);
}

function serializeSavedScenes(items: string[]) {
  return items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- [ ] ${item}`)
    .join("\n");
}

export function ScenePlannerGenerator({
  projectId,
  initialValue,
  isExpanded,
  onActivate,
  onSavedScenesChange,
}: ScenePlannerGeneratorProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedScenes, setSavedScenes] = useState<string[]>(() => parseSavedScenes(initialValue));
  const [error, setError] = useState<string | null>(null);
  const expanded = isExpanded ?? internalExpanded;
  const hasResults = suggestions.length > 0;
  const generateButtonClass = `ml-auto flex items-center gap-1 border border-emerald-800 bg-emerald-700 text-emerald-50 hover:bg-emerald-800 dark:border-emerald-300/40 dark:bg-emerald-300/12 dark:text-emerald-100 ${
    isGenerating ? "animate-pulse shadow-[0_0_0_1px_rgba(4,120,87,0.5)] dark:shadow-[0_0_0_1px_rgba(167,243,208,0.3)]" : ""
  }`;

  const persistSavedScenes = async (nextScenes: string[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "nextStep",
          value: serializeSavedScenes(nextScenes),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save scene prompts");
      }

      setSavedScenes(nextScenes);
      onSavedScenesChange?.(nextScenes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scene prompts");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    onActivate?.();
    setInternalExpanded(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/ideate/situations`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => ({}))) as {
        situations?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate scene prompts");
      }

      const generated = (data.situations ?? []).map((item) => item.trim()).filter(Boolean);
      if (generated.length === 0) {
        throw new Error("No scene prompts generated");
      }

      setSuggestions(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate scene prompts");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSuggestion = async (text: string) => {
    const normalized = text.trim();
    if (!normalized) {
      return;
    }

    if (savedScenes.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
      return;
    }

    const nextScenes = [...savedScenes, normalized];
    await persistSavedScenes(nextScenes);
  };

  return (
    <ActionPanel>
      <div className="mb-2 flex items-baseline gap-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
          Scene Planner
        </h3>
        <Button
          onClick={() => {
            void handleGenerate();
          }}
          disabled={isGenerating || isSaving}
          variant="outline"
          size="sm"
          className={generateButtonClass}
        >
          {isGenerating ? (
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
        Save realistic filming moments so you know what to capture.
      </p>
      <p className="mb-3 ml-6 text-xs text-muted-foreground/80">Generate to review scenes and save what you want to keep.</p>

      {expanded && (
        <div className="ml-6 space-y-3 border-l border-border/70 pl-3">
          {error ? <div className="text-xs text-destructive">{error}</div> : null}

          {suggestions.length === 0 && !isGenerating ? (
            <EmptyState compact title="No scene prompts yet" description="Generate once to see scene planning ideas." />
          ) : (
            <div className="divide-y divide-border/60">
              {suggestions.map((text, idx) => {
                const alreadySaved = savedScenes.some((item) => item.toLowerCase() === text.toLowerCase());

                return (
                  <div
                    key={`${text}-${idx}`}
                    className="flex items-start justify-between gap-2 py-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveSuggestion(text);
                      }}
                      disabled={alreadySaved || isSaving}
                      className={`flex-1 text-left transition ${
                        alreadySaved
                          ? "cursor-default text-muted-foreground"
                          : "cursor-pointer hover:text-foreground hover:underline"
                      }`}
                    >
                      {text}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveSuggestion(text);
                      }}
                      disabled={alreadySaved || isSaving}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-sm transition ${
                        alreadySaved
                          ? "cursor-default text-rose-500 dark:text-rose-400"
                          : "text-muted-foreground hover:text-rose-500"
                      }`}
                      aria-label={alreadySaved ? "Saved scene prompt" : "Save scene prompt"}
                    >
                      <Heart
                        className={alreadySaved ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}
    </ActionPanel>
  );
}
