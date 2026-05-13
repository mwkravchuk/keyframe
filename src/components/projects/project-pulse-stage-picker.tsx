"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoProjectStage } from "@prisma/client";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";

const STAGE_PULSE_STYLES: Record<VideoProjectStage, string> = {
  IDEA: "border-sky-400/35 bg-sky-400/14 text-sky-700 dark:text-sky-300",
  DRAFTING: "border-violet-400/35 bg-violet-400/14 text-violet-700 dark:text-violet-300",
  RECORDING: "border-blue-400/35 bg-blue-400/14 text-blue-700 dark:text-blue-300",
  EDITING: "border-violet-400/35 bg-violet-400/14 text-violet-700 dark:text-violet-300",
  PUBLISHED: "border-emerald-400/35 bg-emerald-400/14 text-emerald-700 dark:text-emerald-300",
  REVIEW: "border-amber-400/35 bg-amber-400/14 text-amber-700 dark:text-amber-300",
};

interface ProjectPulseStagePickerProps {
  projectId: string;
  initialStage: VideoProjectStage;
}

export function ProjectPulseStagePicker({
  projectId,
  initialStage,
}: ProjectPulseStagePickerProps) {
  const router = useRouter();
  const [selectedStage, setSelectedStage] = useState<VideoProjectStage>(initialStage);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStageChange = async (nextStage: VideoProjectStage) => {
    if (nextStage === selectedStage) {
      return;
    }

    const previousStage = selectedStage;
    setSelectedStage(nextStage);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stage");
      }

      router.refresh();
    } catch {
      setSelectedStage(previousStage);
      setError("Failed to update stage");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Stage</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {VIDEO_PROJECT_STAGES.map((stage) => {
          const isSelected = selectedStage === stage;
          return (
            <label
              key={stage}
              className={`inline-flex cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? STAGE_PULSE_STYLES[stage]
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${isSaving ? "opacity-80" : ""}`}
            >
              <input
                type="radio"
                name="stage"
                value={stage}
                checked={isSelected}
                onChange={() => {
                  void handleStageChange(stage);
                }}
                className="sr-only"
              />
              {VIDEO_PROJECT_STAGE_LABELS[stage]}
            </label>
          );
        })}
      </div>
      <div className="mt-1 h-4 text-[11px]">
        {isSaving && <span className="text-muted-foreground">Updating stage...</span>}
        {!isSaving && error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
}
