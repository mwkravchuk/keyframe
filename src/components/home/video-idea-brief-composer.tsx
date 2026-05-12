"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type VideoBriefField, VIDEO_FORMATS } from "@/lib/video-brief";

interface VideoIdeaBriefComposerProps {
  isSignedIn: boolean;
}

function formatFieldLabel(field: VideoBriefField) {
  return field.charAt(0).toUpperCase() + field.slice(1);
}

export function VideoIdeaBriefComposer({ isSignedIn }: VideoIdeaBriefComposerProps) {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [constraints, setConstraints] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  async function handleCreateProject() {
    if (!concept.trim() || isCreatingProject) {
      return;
    }

    setIsCreatingProject(true);
    setCreateError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: concept.trim().split(/[.!?]/)[0]?.trim().slice(0, 120) || "New Project",
          concept: concept.trim(),
          briefFormat: format,
          briefData: JSON.stringify({
            format,
            topic: null,
            audience: audience.trim() || null,
            outcome: null,
            stakes: null,
            constraints: constraints.trim() || null,
            tone: tone.trim() || null,
            rawIdea: concept.trim(),
            confidenceByField: { format: format ? 0.9 : 0, topic: 0, audience: audience ? 0.82 : 0, outcome: 0, stakes: 0, constraints: constraints ? 0.82 : 0, tone: tone ? 0.82 : 0 },
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-semibold text-foreground">Your Video Concept</span>
          <p className="text-xs text-muted-foreground mt-1">Be as detailed as you want. More context helps generate better titles, hooks, and shots.</p>
          <textarea
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            placeholder="What's your video idea? Describe the concept, angle, or moment you want to capture..."
            className="mt-2 w-full min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>

      <div className="space-y-4 rounded-md border border-border bg-card/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add Context (Optional)</p>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Format</p>
          <div className="flex flex-wrap gap-2">
            {VIDEO_FORMATS.map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(format === fmt ? null : fmt)}
                className={`rounded-sm border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                  format === fmt
                    ? "border-accent/60 bg-accent/15 text-foreground"
                    : "border-border text-muted-foreground hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audience</span>
            <input
              type="text"
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="Who is this for?"
              className="mt-1.5 w-full rounded-sm border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tone</span>
            <input
              type="text"
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="e.g., casual, professional, funny"
              className="mt-1.5 w-full rounded-sm border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Constraints</span>
          <input
            type="text"
            value={constraints}
            onChange={(event) => setConstraints(event.target.value)}
            placeholder="e.g., under 5 min, one location, no budget"
            className="mt-1.5 w-full rounded-sm border border-border bg-background px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
      </div>

      {!isSignedIn ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to create a project.
        </p>
      ) : (
        <button
          type="button"
          onClick={handleCreateProject}
          disabled={!concept.trim() || isCreatingProject}
          className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition hover:bg-muted disabled:opacity-50"
        >
          {isCreatingProject ? "Creating project..." : "Create Project"}
        </button>
      )}

      {createError ? <p className="text-center text-xs text-rose-500">{createError}</p> : null}
    </div>
  );
}
