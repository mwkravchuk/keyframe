"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, ListChecks, Zap } from "lucide-react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";

interface ConsolidatorPhaseProps {
  projectId: string;
  shortlistedTitles: string[];
  shortlistedHooks: string[];
  savedScenes: string[];
  currentTitle: string | null;
  currentHook: string | null;
}
interface GeneratorCategory {
  label: string;
  icon: React.ReactNode;
  items: string[];
  fieldName: "title" | "hook" | "scenes";
  currentValue: string | null;
}

export function ConsolidatorPhase({
  projectId,
  shortlistedTitles,
  shortlistedHooks,
  savedScenes,
  currentTitle,
  currentHook,
}: ConsolidatorPhaseProps) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categories: GeneratorCategory[] = [
    {
      label: "Title",
      icon: <Lightbulb className="h-4 w-4" />,
      items: shortlistedTitles,
      fieldName: "title",
      currentValue: currentTitle,
    },
    {
      label: "Hook",
      icon: <Zap className="h-4 w-4" />,
      items: shortlistedHooks,
      fieldName: "hook",
      currentValue: currentHook,
    },
    {
      label: "Scenes",
      icon: <ListChecks className="h-4 w-4" />,
      items: savedScenes,
      fieldName: "scenes",
      currentValue: null,
    },
  ];

  const activeCategories = categories.filter((c) => c.items.length > 0);

  if (activeCategories.length === 0) {
    return null;
  }

  const handleApplySelection = async (fieldName: "title" | "hook" | "scenes", value: string) => {
    if (fieldName === "scenes") {
      return;
    }

    setIsApplying(fieldName);
    setError(null);

    try {
      const payload =
        fieldName === "title"
          ? { field: "title", value }
          : {
              field: "shortlistedHooks",
              value: [
                value,
                ...shortlistedHooks.filter((hook) => hook !== value),
              ],
            };

      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to apply selection");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply selection");
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <ActionPanel className="mt-2">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">
          Finalize your direction using saved titles, hooks, and scene prompts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCategories.map((category) => (
          <div key={category.fieldName} className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-muted-foreground">{category.icon}</span>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {category.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({category.items.length} saved)
              </span>
            </div>
            <div className="space-y-2 flex-1">
              {category.items.map((value) => {
                const isCurrent = value === category.currentValue;
                const isReadOnly = category.fieldName === "scenes";

                return (
                  <div
                    key={value}
                    className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/70 p-3"
                  >
                    <p className="text-sm text-foreground leading-relaxed flex-1 wrap-break-word">
                      {value}
                    </p>
                    {isReadOnly ? (
                      <span className="shrink-0 whitespace-nowrap rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground">
                        Saved
                      </span>
                    ) : (
                      <Button
                        onClick={() => handleApplySelection(category.fieldName, value)}
                        disabled={isApplying === category.fieldName || isCurrent}
                        variant={isCurrent ? "outline" : "subtle"}
                        size="sm"
                        className={`shrink-0 whitespace-nowrap ${
                          isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isCurrent ? "Applied" : isApplying === category.fieldName ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 text-xs text-destructive">{error}</div>
      )}
    </ActionPanel>
  );
}
