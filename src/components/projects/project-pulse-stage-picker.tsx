"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoProjectStage } from "@prisma/client";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";

const STAGE_PULSE_STYLES: Record<VideoProjectStage, string> = {
  IDEA: "border-zinc-300 bg-zinc-100 text-zinc-800",
  DRAFTING: "border-sky-300 bg-sky-100 text-sky-800",
  RECORDING: "border-blue-300 bg-blue-100 text-blue-800",
  EDITING: "border-violet-300 bg-violet-100 text-violet-800",
  PUBLISHED: "border-emerald-300 bg-emerald-100 text-emerald-800",
  REVIEW: "border-amber-300 bg-amber-100 text-amber-800",
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
              className={`inline-flex cursor-pointer items-center justify-center rounded-sm border px-2 py-1.5 text-xs font-semibold transition ${
                isSelected
                  ? STAGE_PULSE_STYLES[stage]
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
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
