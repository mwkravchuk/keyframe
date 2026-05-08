import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";
import { updateProjectAction } from "../actions";

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
          <div className="space-y-6">
            <div className="rounded-sm border border-border bg-card/30 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Title Ideation</h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-accent"
                >
                  Generate options →
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">AI will suggest 4-5 compelling titles based on your concept.</p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                  Click "Generate options" to see AI suggestions
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card/30 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Hook Generator</h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-accent"
                >
                  Create opening →
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">First 3 seconds that stops the scroll.</p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                  Generate a hook once you've refined your concept
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card/30 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Angle Sharpener</h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-accent"
                >
                  Clarify angle →
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">What makes this unique? Why now? For whom?</p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                  AI will ask clarifying questions
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card/30 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Thumbnail Direction</h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-accent"
                >
                  Visualize →
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Visual hook ideas and composition suggestions.</p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                  Get visual direction based on your concept
                </div>
              </div>
            </div>

            <div className="rounded-sm border border-border bg-card/30 p-4">
              <div className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Viewer Promise</h3>
                <button
                  type="button"
                  className="text-xs text-muted-foreground transition hover:text-accent"
                >
                  Define promise →
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">What will viewers gain? (Clarity, entertainment, value, etc.)</p>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground px-3 py-2 rounded border border-dashed border-border">
                  AI will help crystallize the viewer value prop
                </div>
              </div>
            </div>
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
                name="structure"
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
