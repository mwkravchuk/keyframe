"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VIDEO_FORMATS } from "@/lib/video-brief";
import { Button } from "@/components/ui/button";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";

interface VideoIdeaBriefComposerProps {
  isSignedIn: boolean;
}

export function VideoIdeaBriefComposer({ isSignedIn }: VideoIdeaBriefComposerProps) {
  const router = useRouter();
  const [concept, setConcept] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [constraints, setConstraints] = useState("");
  const [step, setStep] = useState<"idea" | "details">("idea");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);


  function handleNextStep() {
    if (!concept.trim()) return;
    // In a real implementation, autofill logic would go here.
    setStep("details");
  }

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
    <div className="space-y-5">
      {step === "idea" ? (
        <div className="space-y-4">
          <Textarea
            id="home-concept"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            placeholder="Describe the story, angle, or moment you want to capture..."
            rows={6}
            className="mt-2.5 min-h-44 resize-y bg-background/35 text-base"
          />
          <Button
            variant="primary"
            size="md"
            onClick={handleNextStep}
            disabled={!concept.trim()}
            className="mt-2 w-full sm:w-auto"
          >
            Next
          </Button>
        </div>
      ) : (
        <div className="space-y-4 border-t border-border/70 pt-4">
          <FieldLabel htmlFor="home-concept">Video Idea</FieldLabel>
          <Textarea
            id="home-concept"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            rows={4}
            className="mt-2.5 min-h-24 resize-y bg-background/35 text-base"
            disabled
          />
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="home-format" muted>
                Format
              </FieldLabel>
              <select
                id="home-format"
                value={format ?? ""}
                onChange={(event) => setFormat(event.target.value || null)}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Any format</option>
                {VIDEO_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="home-audience" muted>
                Audience
              </FieldLabel>
              <Input
                id="home-audience"
                value={audience}
                onChange={(event) => setAudience(event.target.value)}
                placeholder="Who this is for"
                className="mt-1.5"
              />
            </div>
            <div>
              <FieldLabel htmlFor="home-tone" muted>
                Tone
              </FieldLabel>
              <Input
                id="home-tone"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                placeholder="Calm, punchy, educational"
                className="mt-1.5"
              />
            </div>
            <div>
              <FieldLabel htmlFor="home-constraints" muted>
                Constraints
              </FieldLabel>
              <Input
                id="home-constraints"
                value={constraints}
                onChange={(event) => setConstraints(event.target.value)}
                placeholder="Runtime, location, gear limits"
                className="mt-1.5"
              />
            </div>
          </div>
          {isSignedIn ? (
            <Button
              variant="primary"
              size="md"
              onClick={handleCreateProject}
              disabled={!concept.trim() || isCreatingProject}
              className="mt-4 w-full sm:w-auto"
            >
              {isCreatingProject ? "Creating project..." : "Create project"}
            </Button>
          ) : null}
        </div>
      )}
      {!isSignedIn ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>{" "}
          to create a project.
        </p>
      ) : null}
      {createError ? <p className="text-center text-xs text-rose-500">{createError}</p> : null}
    </div>
  );
}
