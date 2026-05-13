import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { TitleIdeation } from "@/components/projects/title-ideation";
import { ConsolidatorPhase } from "@/components/projects/consolidator-phase";
import { HookGenerator } from "@/components/projects/hook-generator";
import { NoteScratchpad } from "@/components/projects/note-scratchpad";
import { ProjectPulseFields } from "@/components/projects/project-pulse-fields";
import { AutoSaveTextarea } from "@/components/projects/auto-save-textarea";
import { ShotlistChecklist } from "@/components/projects/shotlist-checklist";
import { ProjectTitleInline } from "@/components/projects/project-title-inline";
import { ActionPanel } from "@/components/ui/action-panel";

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
    select: { channelId: true, title: true, avatarUrl: true },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });

  const targetPublishAt = project.targetPublishAt
    ? project.targetPublishAt.toISOString().slice(0, 10)
    : "";

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

  return (
    <div className="kf-project-detail grid grid-cols-1 gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <ActionPanel>
          <Link href="/projects" className="mb-4 inline-block text-xs text-muted-foreground transition hover:text-foreground">
            ← Back to board
          </Link>
          <ProjectTitleInline
            projectId={project.id}
            initialTitle={project.title}
          />
        </ActionPanel>

        <ActionPanel>
          <ProjectPulseFields
            projectId={project.id}
            initialStage={project.stage}
            initialTargetPublishAt={targetPublishAt}
            initialYoutubeChannelId={project.youtubeChannelId}
            channels={channels}
          />
        </ActionPanel>

        <ActionPanel>
          <NoteScratchpad
            projectId={project.id}
            initialNotes={project.notes ?? ""}
            variant="light"
          />
        </ActionPanel>
      </aside>

      <main className="space-y-6">
        <AutoSaveTextarea
          projectId={project.id}
          field="concept"
          label="Concept (Your Seed Idea)"
          initialValue={project.concept ?? ""}
          placeholder="Write out your raw idea. Vagueness is fine and we can refine it together."
          rows={10}
          variant="light"
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <TitleIdeation
              projectId={project.id}
              concept={project.concept || ""}
              proposedTitles={proposedTitles}
              shortlistedTitles={shortlistedTitles}
            />

            <HookGenerator
              projectId={project.id}
              concept={project.concept || ""}
              projectTitle={project.title}
              shortlistedHooks={shortlistedHooks}
            />
          </div>

          <div>
            <ShotlistChecklist
              projectId={project.id}
              initialValue={project.nextStep ?? ""}
            />
          </div>
        </div>

        <ConsolidatorPhase
          projectId={project.id}
          shortlistedTitles={shortlistedTitles}
          currentTitle={project.title}
        />
      </main>
    </div>
  );
}
