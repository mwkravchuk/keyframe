import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { NoteScratchpad } from "@/components/projects/note-scratchpad";
import { ProjectPulseFields } from "@/components/projects/project-pulse-fields";
import { AutoSaveTextarea } from "@/components/projects/auto-save-textarea";
import { ProjectTitleInline } from "@/components/projects/project-title-inline";
import { ActionPanel } from "@/components/ui/action-panel";
import { ProjectGeneratorStack } from "@/components/projects/project-generator-stack";

function parseSavedScenes(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const checklistMatch = line.match(/^[-*]\s*\[(x| )\]\s*(.+)$/i);
      if (checklistMatch) {
        return checklistMatch[2].trim();
      }

      return line.replace(/^[-*]\s*/, "").trim();
    })
    .filter(Boolean);
}

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

  const savedScenes = parseSavedScenes(project.nextStep);
  const currentHook = shortlistedHooks[0] ?? null;

  return (
    <div className="kf-project-detail space-y-6">
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Manage</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Project setup and details.</h2>
        </div>

        <ActionPanel>
          <Link
            href="/projects"
            className="mb-4 inline-block text-xs text-muted-foreground transition hover:text-foreground"
          >
            ← Back to board
          </Link>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div className="space-y-5">
              <ProjectTitleInline
                projectId={project.id}
                initialTitle={project.title}
              />

              <NoteScratchpad
                projectId={project.id}
                initialNotes={project.notes ?? ""}
                variant="light"
              />
            </div>

            <ProjectPulseFields
              projectId={project.id}
              initialStage={project.stage}
              initialTargetPublishAt={targetPublishAt}
              initialYoutubeChannelId={project.youtubeChannelId}
              channels={channels}
            />
          </div>
        </ActionPanel>
      </section>

      <main className="space-y-5">
        <AutoSaveTextarea
          projectId={project.id}
          field="concept"
          label="Concept (Your Seed Idea)"
          initialValue={project.concept ?? ""}
          placeholder="Write out your raw idea. Vagueness is fine and we can refine it together."
          rows={2}
          variant="light"
        />

        <ProjectGeneratorStack
          projectId={project.id}
          concept={project.concept || ""}
          projectTitle={project.title}
          proposedTitles={proposedTitles}
          shortlistedTitles={shortlistedTitles}
          shortlistedHooks={shortlistedHooks}
          savedScenes={savedScenes}
          currentTitle={project.title}
          currentHook={currentHook}
        />
      </main>
    </div>
  );
}
