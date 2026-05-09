"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Zap, ImageIcon } from "lucide-react";
import type { ThumbnailDirectionOption } from "@/lib/ai";

interface ConsolidatorPhaseProps {
  projectId: string;
  shortlistedTitles: string[];
  shortlistedHooks: string[];
  shortlistedThumbnailDirections: ThumbnailDirectionOption[];
  currentTitle: string | null;
  currentHook: string | null;
  currentThumbnailDirection: string | null;
}
interface GeneratorCategory {
  label: string;
  icon: React.ReactNode;
  items: string[] | ThumbnailDirectionOption[];
  fieldName: string;
  currentValue: string | null;
}

export function ConsolidatorPhase({
  projectId,
  shortlistedTitles,
  shortlistedHooks,
  shortlistedThumbnailDirections,
  currentTitle,
  currentHook,
  currentThumbnailDirection,
}: ConsolidatorPhaseProps) {
  const router = useRouter();
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const categories: GeneratorCategory[] = [
    {
      label: "Title",
      icon: <Lightbulb className="h-4 w-4" />,
      items: shortlistedTitles,
      fieldName: "selectedTitle",
      currentValue: currentTitle,
    },
    {
      label: "Hook",
      icon: <Zap className="h-4 w-4" />,
      items: shortlistedHooks,
      fieldName: "selectedHook",
      currentValue: currentHook,
    },
    {
      label: "Thumbnail Direction",
      icon: <ImageIcon className="h-4 w-4" />,
      items: shortlistedThumbnailDirections,
      fieldName: "selectedThumbnailDirection",
      currentValue: currentThumbnailDirection,
    },
  ];

  const activeCategories = categories.filter((c) => c.items.length > 0);

  if (activeCategories.length === 0) {
    return null;
  }

  const handleApplySelection = async (fieldName: string, value: string) => {
    setIsApplying(fieldName);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/selections`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: fieldName,
          value: value,
        }),
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
    <div className="mt-12 border-t border-border pt-8">
      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
          Project Consolidator
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick from your saved ideas and apply them as project details
        </p>
      </div>

      <div className="space-y-6">
        {activeCategories.map((category) => (
          <div key={category.fieldName}>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-muted-foreground">{category.icon}</span>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {category.label}
              </h3>
              <span className="text-xs text-muted-foreground">
                ({category.items.length} saved)
              </span>
            </div>
            <div className="ml-6 space-y-2">
              {category.items.map((item) => {
                if (category.fieldName === "selectedThumbnailDirection") {
                  const thumbnail = item as ThumbnailDirectionOption;
                  const serialized = JSON.stringify(thumbnail);
                  const isCurrent = category.currentValue === serialized;

                  return (
                    <div
                      key={serialized}
                      className="rounded-sm border border-border/50 bg-card/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <p className="text-sm font-medium text-foreground break-words">
                            {thumbnail.mainVisualElement}
                          </p>
                          <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                            <p><span className="font-semibold text-foreground">Color palette:</span> {thumbnail.colorPalette || "-"}</p>
                            <p><span className="font-semibold text-foreground">Composition:</span> {thumbnail.composition || "-"}</p>
                            <p><span className="font-semibold text-foreground">Text overlay:</span> {thumbnail.textOverlay || "-"}</p>
                            <p><span className="font-semibold text-foreground">Tone:</span> {thumbnail.emotionalTone || "-"}</p>
                            <p><span className="font-semibold text-foreground">Style:</span> {thumbnail.referenceStyle || "-"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplySelection(category.fieldName, serialized)}
                          disabled={isApplying === category.fieldName || isCurrent}
                          className={`flex-shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition ${
                            isCurrent
                              ? "bg-accent/20 text-accent"
                              : "bg-border/20 text-muted-foreground hover:bg-border/40 disabled:opacity-50"
                          }`}
                        >
                          {isCurrent ? "Applied" : isApplying === category.fieldName ? "Applying..." : "Apply"}
                        </button>
                      </div>
                    </div>
                  );
                }

                const value = item as string;
                const isCurrent = value === category.currentValue;

                return (
                  <div
                    key={value}
                    className="flex items-start justify-between gap-3 rounded-sm border border-border/50 bg-card/30 p-3"
                  >
                    <p className="text-sm text-foreground leading-relaxed flex-1 break-words">
                      {value}
                    </p>
                    <button
                      onClick={() => handleApplySelection(category.fieldName, value)}
                      disabled={isApplying === category.fieldName || isCurrent}
                      className={`flex-shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition ${
                        isCurrent
                          ? "bg-accent/20 text-accent"
                          : "bg-border/20 text-muted-foreground hover:bg-border/40 disabled:opacity-50"
                      }`}
                    >
                      {isCurrent ? "Applied" : isApplying === category.fieldName ? "Applying..." : "Apply"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-3 text-xs text-red-500">{error}</div>
      )}
    </div>
  );
}
