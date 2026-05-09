import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";
import { updateProjectAction } from "../actions";
import { Zap, ImageIcon } from "lucide-react";
import { TitleIdeation } from "@/components/projects/title-ideation";
import { ConsolidatorPhase } from "@/components/projects/consolidator-phase";
import { HookGenerator } from "@/components/projects/hook-generator";
import { ThumbnailGenerator } from "@/components/projects/thumbnail-generator";
import type { ThumbnailDirectionOption } from "@/lib/ai";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.videoProject.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!project) {
    notFound();
  }

  const channels = await prisma.youtubeChannel.findMany({
    where: { userId },
    select: { channelId: true, title: true },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  const targetPublishAt = project.targetPublishAt
    ? project.targetPublishAt.toISOString().slice(0, 10)
    : "";

  // Parse AI-generated suggestions
  let proposedTitles: string[] | null = null;
  if (project.proposedTitles) {
    try {
      proposedTitles = JSON.parse(project.proposedTitles);
    } catch {
      proposedTitles = null;
    }
  }

  let shortlistedTitles: string[] = [];
  if (project.shortlistedTitles) {
    try {
      const parsed = JSON.parse(project.shortlistedTitles);
      if (Array.isArray(parsed)) {
        shortlistedTitles = parsed.filter((item) => typeof item === "string");
      }
    } catch {
      shortlistedTitles = [];
    }
  }

  let shortlistedHooks: string[] = [];
  if (project.shortlistedHooks) {
    try {
      const parsed = JSON.parse(project.shortlistedHooks);
      if (Array.isArray(parsed)) {
        shortlistedHooks = parsed.filter((item) => typeof item === "string");
      }
    } catch {
      shortlistedHooks = [];
    }
  }

  let shortlistedThumbnailDirections: ThumbnailDirectionOption[] = [];
  if (project.shortlistedThumbnailDirection) {
    try {
      const parsed = JSON.parse(project.shortlistedThumbnailDirection);
      if (Array.isArray(parsed)) {
        shortlistedThumbnailDirections = parsed
          .map((item) => {
            if (typeof item === "string") {
              try {
                const maybeObject = JSON.parse(item) as unknown;
                if (maybeObject && typeof maybeObject === "object" && !Array.isArray(maybeObject)) {
                  return maybeObject as ThumbnailDirectionOption;
                }
              } catch {
                return {
                  mainVisualElement: item,
                  colorPalette: "",
                  composition: "",
                  textOverlay: "",
                  emotionalTone: "",
                  referenceStyle: "",
                };
              }

              return {
                mainVisualElement: item,
                colorPalette: "",
                composition: "",
                textOverlay: "",
                emotionalTone: "",
                referenceStyle: "",
              };
            }

            if (item && typeof item === "object") {
              const record = item as Record<string, unknown>;
              const mainVisualElement =
                typeof record.mainVisualElement === "string"
                  ? record.mainVisualElement
                  : typeof record["main visual element"] === "string"
                    ? record["main visual element"] as string
                    : typeof record.summary === "string"
                      ? record.summary
                      : "";

              if (!mainVisualElement) {
                return null;
              }

              return {
                mainVisualElement,
                colorPalette: typeof record.colorPalette === "string" ? record.colorPalette : typeof record["color palette"] === "string" ? (record["color palette"] as string) : "",
                composition: typeof record.composition === "string" ? record.composition : typeof record["composition idea"] === "string" ? (record["composition idea"] as string) : "",
                textOverlay: typeof record.textOverlay === "string" ? record.textOverlay : typeof record["text overlay"] === "string" ? (record["text overlay"] as string) : "",
                emotionalTone: typeof record.emotionalTone === "string" ? record.emotionalTone : typeof record["emotional tone"] === "string" ? (record["emotional tone"] as string) : "",
                referenceStyle: typeof record.referenceStyle === "string" ? record.referenceStyle : typeof record["reference style"] === "string" ? (record["reference style"] as string) : "",
              };
            }

            return null;
          })
          .filter((item): item is ThumbnailDirectionOption => item !== null);
      }
    } catch {
      shortlistedThumbnailDirections = [];
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 lg:px-10">
      <Link href="/projects" className="mb-6 inline-block text-xs text-muted-foreground transition hover:text-foreground">
        ← Back to board
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Develop your concept and gain clarity before filming.</p>
      </div>

      <form action={updateProjectAction} className="mt-8 border-t border-border pt-6">
        <input type="hidden" name="id" value={project.id} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: AI-Assisted Clarity Tools */}
          <div className="space-y-8">
            {/* Title Ideation */}
            <TitleIdeation
              projectId={project.id}
              projectTitle={project.title}
              concept={project.concept || ""}
              selectedTitle={project.selectedTitle}
              proposedTitles={proposedTitles}
              shortlistedTitles={shortlistedTitles}
            />

            {/* Hook Generator */}
            <HookGenerator
              projectId={project.id}
              concept={project.concept || ""}
              projectTitle={project.title}
              shortlistedHooks={shortlistedHooks}
            />

            {/* Thumbnail Direction */}
            <ThumbnailGenerator
              projectId={project.id}
              concept={project.concept || ""}
              projectTitle={project.title}
              shortlistedThumbnailDirections={shortlistedThumbnailDirections}
            />

          </div>

          {/* Right Column: Creator Workspace */}
          <div className="space-y-6">
            <div>
              <label htmlFor="concept" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Concept (Your Seed Idea)
              </label>
              <textarea
                id="concept"
                name="concept"
                defaultValue={project.concept ?? ""}
                placeholder="Write out your raw idea. Vagueness is fine—we'll refine it together."
                rows={6}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label htmlFor="structure" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Structure Outline
              </label>
              <textarea
                id="structure"
                name="nextStep"
                defaultValue={project.nextStep ?? ""}
                placeholder="Rough flow: intro → problem → solution → cta
Or: opening hook → story → payoff
Keep it loose—this evolves as you clarify."
                rows={4}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50"
              />
            </div>

            <div>
              <label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Notes & Scratch Ideas
              </label>
              <textarea
                id="notes"
                name="notes"
                defaultValue={project.notes ?? ""}
                placeholder="Quick thoughts, reference links, segment ideas, anything that helps you remember the vision."
                rows={4}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Project Consolidator Phase */}
        <ConsolidatorPhase
           projectId={project.id}
           shortlistedTitles={shortlistedTitles}
           shortlistedHooks={shortlistedHooks}
           shortlistedThumbnailDirections={shortlistedThumbnailDirections}
           currentTitle={project.selectedTitle}
           currentHook={project.selectedHook}
           currentThumbnailDirection={project.selectedThumbnailDirection}
        />

        {/* Metadata Section (Collapsible) */}
        <details className="mt-8 border-t border-border pt-6">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground transition hover:text-foreground">
            + Production Metadata
          </summary>
          
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label htmlFor="stage" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Stage
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={project.stage}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
              >
                {VIDEO_PROJECT_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {VIDEO_PROJECT_STAGE_LABELS[stage]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="targetPublishAt" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Target Publish Date
              </label>
              <input
                id="targetPublishAt"
                name="targetPublishAt"
                type="date"
                defaultValue={targetPublishAt}
                className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            {channels.length > 0 && (
              <div>
                <label htmlFor="youtubeChannelId" className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  YouTube Channel
                </label>
                <select
                  id="youtubeChannelId"
                  name="youtubeChannelId"
                  defaultValue={project.youtubeChannelId ?? ""}
                  className="mt-2 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No channel assigned</option>
                  {channels.map((c) => (
                    <option key={c.channelId} value={c.channelId}>
                      {c.title ?? c.channelId}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </details>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="submit"
            className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            Save concept
          </button>
          <span className="text-xs text-muted-foreground">
            All changes are saved automatically
          </span>
        </div>
      </form>
    </section>
  );
}
