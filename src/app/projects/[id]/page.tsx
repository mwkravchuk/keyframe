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
import { ShotlistChecklist } from "../../../components/projects/shotlist-checklist";
import { ProjectTitleInline } from "@/components/projects/project-title-inline";

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
    <div className="flex h-screen">
      {/* Left Column */}
      <aside className="w-1/4 overflow-y-auto border-r border-gray-300 bg-gray-100 p-6">
        <Link href="/projects" className="mb-6 inline-block text-xs text-muted-foreground transition hover:text-foreground">
          ← Back to board
        </Link>
        <div className="mb-8">
          <ProjectTitleInline
            projectId={project.id}
            initialTitle={project.title}
          />
        </div>

        <ProjectPulseFields
          projectId={project.id}
          initialStage={project.stage}
          initialTargetPublishAt={targetPublishAt}
          initialYoutubeChannelId={project.youtubeChannelId}
          channels={channels}
        />

        <div className="mt-6">
          <NoteScratchpad
            projectId={project.id}
            initialNotes={project.notes ?? ""}
            variant="light"
          />
        </div>
      </aside>

      {/* Right Column */}
      <main className="flex-1 p-6 overflow-y-auto">
        <AutoSaveTextarea
          projectId={project.id}
          field="concept"
          label="Concept (Your Seed Idea)"
          initialValue={project.concept ?? ""}
          placeholder="Write out your raw idea. Vagueness is fine-we'll refine it together."
          rows={10}
          variant="light"
        />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
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

        <div className="mt-8">
          <ConsolidatorPhase
            projectId={project.id}
            shortlistedTitles={shortlistedTitles}
            currentTitle={project.title}
          />
        </div>
      </main>
    </div>
  );
}
