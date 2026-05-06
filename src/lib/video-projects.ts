import type { VideoProjectStage } from "@prisma/client";

export type { VideoProjectStage };

export const VIDEO_PROJECT_STAGES: VideoProjectStage[] = [
  "IDEA",
  "DRAFTING",
  "RECORDING",
  "EDITING",
  "PUBLISHED",
];

export const VIDEO_PROJECT_STAGE_LABELS: Record<VideoProjectStage, string> = {
  IDEA: "Idea",
  DRAFTING: "Drafting",
  RECORDING: "Recording",
  EDITING: "Editing",
  PUBLISHED: "Published",
};

export function getAdjacentStage(
  stage: VideoProjectStage,
  direction: "prev" | "next",
): VideoProjectStage | null {
  const currentIndex = VIDEO_PROJECT_STAGES.indexOf(stage);
  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  return VIDEO_PROJECT_STAGES[nextIndex] ?? null;
}
