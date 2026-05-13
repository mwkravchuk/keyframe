"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";

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
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hooks, setHooks] = useState<string[]>([]);
  const [shortlistedHooks, setShortlistedHooks] = useState<string[]>(
    initialShortlistedHooks || []
  );
  const [manualHook, setManualHook] = useState("");
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shortlist");
    }
  };

  const handleManualSave = async () => {
    const value = manualHook.trim();
    if (!value) {
      return;
    }

    if (shortlistedHooks.includes(value)) {
      setManualHook("");
      return;
    }

    const nextShortlist = [...shortlistedHooks, value];

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
        throw new Error("Failed to save hook");
      }

      setShortlistedHooks(nextShortlist);
      setManualHook("");
      setError(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save hook");
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
      <p className="mb-3 ml-6 text-xs text-muted-foreground">
        First 3 seconds that stops the scroll
      </p>

      <div className="mb-4 ml-6 border-l border-border/70 pl-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground">
          Saved Hooks ({shortlistedHooks.length})
        </p>

        {shortlistedHooks.length === 0 ? (
          <EmptyState compact title="No saved hooks yet" description="Save your best hooks to consolidate later." />
        ) : (
          <div className="space-y-2">
            {shortlistedHooks.map((hook, idx) => (
              <div
                key={`${hook}-${idx}`}
                className="flex items-start justify-between gap-2 border-b border-border/60 py-2 text-xs"
              >
                <span className="flex-1">{hook}</span>
                <Button
                  onClick={() => handleShortlistToggle(hook)}
                  variant="subtle"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Input
            value={manualHook}
            onChange={(event) => setManualHook(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleManualSave();
              }
            }}
            placeholder="Write your own hook to save"
            className="text-xs"
          />
          <Button
            onClick={handleManualSave}
            variant="subtle"
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-6 space-y-2 border-l border-border/70 pl-3">
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
                  <span className="flex-1">{hook}</span>
                  <Button
                    onClick={() => handleShortlistToggle(hook)}
                    variant={shortlistedHooks.includes(hook) ? "outline" : "subtle"}
                    size="sm"
                    className={`whitespace-nowrap ${
                      shortlistedHooks.includes(hook)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {shortlistedHooks.includes(hook) ? "Saved" : "Save"}
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
            <EmptyState compact title="No hooks yet" description="Generate once to see opening line ideas." />
          )}
        </div>
      )}
    </ActionPanel>
  );
}
