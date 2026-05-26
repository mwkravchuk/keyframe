"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { VIDEO_FORMATS } from "@/lib/video-brief";
import { FieldLabel, Textarea } from "@/components/ui/field";

interface VideoIdeaBriefComposerProps {
  isSignedIn: boolean;
}

export function VideoIdeaBriefComposer({ isSignedIn }: VideoIdeaBriefComposerProps) {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [showFormatStep, setShowFormatStep] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  async function handleCreateProject(selectedFormat: string | null) {
    if (!concept.trim() || isCreatingProject || !isSignedIn) {
      return;
    }

    setIsCreatingProject(true);
    setCreateError(null);
    setFormat(selectedFormat);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: concept.trim(),
          briefFormat: selectedFormat,
          briefData: JSON.stringify({
            format: selectedFormat,
            topic: null,
            audience: null,
            outcome: null,
            stakes: null,
            constraints: null,
            tone: null,
            rawIdea: concept.trim(),
            confidenceByField: { format: selectedFormat ? 0.9 : 0, topic: 0, audience: 0, outcome: 0, stakes: 0, constraints: 0, tone: 0 },
            missingFields: [],
          }),
        }),
      });

      const data = (await response.json()) as {
        project?: { id?: string };
        error?: string;
      };

      if (!response.ok || !data.project?.id) {
        throw new Error(data.error || "Failed to create project");
      }

      router.push(`/projects/${data.project.id}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "Failed to create project");
      setIsCreatingProject(false);
    }
  }

  function handleIdeaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!concept.trim() || isCreatingProject) {
      return;
    }

    setCreateError(null);
    setShowFormatStep(true);
  }

  function handleFormatChange(nextFormat: string | null) {
    if (!isSignedIn || isCreatingProject) {
      setFormat(nextFormat);
      return;
    }

    void handleCreateProject(nextFormat);
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Textarea
          id="home-concept"
          value={concept}
          onChange={(event) => {
            const next = event.target.value;
            setConcept(next);

            if (!next.trim()) {
              setShowFormatStep(false);
              setFormat(null);
            }
          }}
          onKeyDown={handleIdeaKeyDown}
          placeholder="Drop your idea spark..."
          rows={2}
          className="mt-2.5 min-h-20 resize-none bg-background/35 pr-12 text-base"
        />
        <div className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 p-1.5 text-muted-foreground">
          <ArrowRight size={14} />
        </div>
      </div>

      {showFormatStep && concept.trim() ? (
        <div className="space-y-4 border-t border-border/70 pt-4">
          <div className="space-y-1">
            <FieldLabel htmlFor="home-format">Choose video format</FieldLabel>
          </div>

          <div id="home-format" className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            {VIDEO_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => handleFormatChange(fmt)}
                disabled={isCreatingProject}
                className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs transition ${
                  format === fmt
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:border-foreground/30"
                }`}
                aria-pressed={format === fmt}
              >
                {fmt}
              </button>
            ))}
          </div>

          {isCreatingProject ? <p className="text-xs text-muted-foreground">Creating project...</p> : null}
        </div>
      ) : null}
      {!isSignedIn ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to create a project after choosing a format.
        </p>
      ) : null}
      {createError ? <p className="text-center text-xs text-rose-500">{createError}</p> : null}
    </div>
  );
}
