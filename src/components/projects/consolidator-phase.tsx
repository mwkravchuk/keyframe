"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

interface ConsolidatorPhaseProps {
  projectId: string;
  shortlistedTitles: string[];
  currentTitle: string | null;
}
interface GeneratorCategory {
  label: string;
  icon: React.ReactNode;
  items: string[];
  fieldName: string;
  currentValue: string | null;
}

export function ConsolidatorPhase({
  projectId,
  shortlistedTitles,
  currentTitle,
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

                return (
                  <div
                    key={value}
                    className="flex items-start justify-between gap-3 rounded-sm border border-border/50 bg-card/30 p-3"
                  >
                    <p className="text-sm text-foreground leading-relaxed flex-1 wrap-break-word">
                      {value}
                    </p>
                    <button
                      onClick={() => handleApplySelection(category.fieldName, value)}
                      disabled={isApplying === category.fieldName || isCurrent}
                      className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-medium transition ${
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
