import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { NoteScratchpad } from "@/components/projects/note-scratchpad";
import { ProjectPulseFields } from "@/components/projects/project-pulse-fields";
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

  let submagicData: {
    id: string;
    status: string;
    previewUrl: string | null;
    downloadUrl: string | null;
    directUrl: string | null;
    failureReason: string | null;
    updatedAt: string | null;
    magicClips: Array<{
      id: string;
      title: string;
      status: string;
      duration: number | null;
      previewUrl: string | null;
      downloadUrl: string | null;
      directUrl: string | null;
      viralityTotal: number | null;
    }>;
  } | null = null;

  if (project.submagicData) {
    try {
      submagicData = JSON.parse(project.submagicData);
    } catch {
      submagicData = null;
    }
  }

  return (
    <div className="kf-project-detail mx-auto w-full max-w-6xl space-y-16 lg:space-y-20">
      <Link
        href="/projects"
        className="inline-flex items-center rounded-md border border-border/70 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-border hover:text-foreground"
      >
        ← Back to board
      </Link>

      <section>
        <ActionPanel>
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,1fr)]">
            <div className="space-y-6">
              <ProjectTitleInline
                projectId={project.id}
                initialTitle={project.title}
              />

              <ProjectPulseFields
                projectId={project.id}
                initialStage={project.stage}
                initialTargetPublishAt={targetPublishAt}
                initialYoutubeChannelId={project.youtubeChannelId}
                initialYoutubeVideoUrl={project.youtubeVideoUrl ?? ""}
                channels={channels}
              />
            </div>

            <aside className="border-t border-border/70 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <NoteScratchpad
                projectId={project.id}
                initialNotes={project.notes ?? ""}
                variant="light"
                rows={7}
              />
            </aside>
          </div>
        </ActionPanel>
      </section>

      <main className="space-y-12 lg:space-y-14">
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
          hasYoutubeVideoUrl={Boolean(project.youtubeVideoUrl)}
          initialSubmagicStatus={project.submagicStatus}
          initialSubmagicData={submagicData}
        />
      </main>
    </div>
  );
}
