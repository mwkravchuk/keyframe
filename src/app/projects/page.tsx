import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { createProjectAction } from "./actions";
import { ProjectsPipelineBoard } from "@/components/projects/projects-pipeline-board";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    redirect("/login");
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
    },
  });

  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
  });

  const projectItems = projects.map((project) => ({
    id: project.id,
    title: project.title,
    concept: project.concept,
    notes: project.notes,
    nextStep: project.nextStep,
    stage: project.stage,
  }));

  const creatorName = creator?.name?.trim() || session?.user?.name?.trim() || "Creator";
  const creatorAvatarUrl = creator?.image || session?.user?.image || null;
  const creatorBannerUrl: string | null = null;
  const creatorInitials = creatorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CR";

  return (
    <section>
        <div className="relative left-1/2 w-screen -translate-x-1/2 border-t border-border">
          <div className="relative h-36 border-b border-border bg-surface-2 sm:h-44 lg:h-52">
          {creatorBannerUrl ? (
            <img
              src={creatorBannerUrl}
              alt={`${creatorName} banner`}
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.07),transparent_40%),linear-gradient(20deg,rgba(255,255,255,0.04),transparent_55%),repeating-linear-gradient(120deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_22px)]" />
              <div className="absolute inset-x-6 bottom-3 mx-auto w-full max-w-6xl px-6 text-[11px] font-medium tracking-wide text-muted-foreground/90 lg:px-10">
                YouTube banner will appear here after integration.
              </div>
            </>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-6 pb-5 pt-4 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="relative -mt-14 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-semibold text-foreground shadow-lg shadow-black/15 sm:-mt-16 sm:h-32 sm:w-32">
              {creatorAvatarUrl ? (
                <img
                  src={creatorAvatarUrl}
                  alt={`${creatorName} avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{creatorInitials}</span>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{creatorName}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Projects</h2>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              Use video generator
            </Link>

            <details className="group relative">
              <summary className="list-none rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
                New project
              </summary>
              <div className="absolute right-0 z-20 mt-3 w-90 rounded-sm border border-border bg-card p-4 shadow-2xl shadow-black/20">
                <form action={createProjectAction} className="space-y-3">
                  <input type="hidden" name="stage" value="DRAFTING" />
                  <div>
                    <label htmlFor="title" className="text-xs text-muted-foreground">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      required
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="concept" className="text-xs text-muted-foreground">
                      Concept
                    </label>
                    <textarea
                      id="concept"
                      name="concept"
                      rows={3}
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="nextStep" className="text-xs text-muted-foreground">
                      Next step
                    </label>
                    <input
                      id="nextStep"
                      name="nextStep"
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="targetPublishAt" className="text-xs text-muted-foreground">
                      Target publish date
                    </label>
                    <input
                      id="targetPublishAt"
                      name="targetPublishAt"
                      type="date"
                      className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-sm border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                  >
                    Create project
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>

        <ProjectsPipelineBoard initialProjects={projectItems} />
      </div>
    </section>
  );
}
