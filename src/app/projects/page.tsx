import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProjectAction } from "./actions";
import { ProjectsPipelineBoard } from "@/components/projects/projects-pipeline-board";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
  });

  const projectItems = projects.map((project) => ({
    id: project.id,
    title: project.title,
    concept: project.concept,
    nextStep: project.nextStep,
    stage: project.stage,
  }));

  return (
    <section>
      <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Track each video through the production pipeline.
          </p>
        </div>

        <details className="group relative">
          <summary className="list-none rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-105">
            New project
          </summary>
          <div className="absolute right-0 z-20 mt-3 w-[360px] border border-border bg-card p-4 shadow-2xl shadow-black/20">
            <form action={createProjectAction} className="space-y-3">
              <div>
                <label htmlFor="title" className="text-xs text-muted-foreground">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="nextStep" className="text-xs text-muted-foreground">
                  Next step
                </label>
                <input
                  id="nextStep"
                  name="nextStep"
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                Create project
              </button>
            </form>
          </div>
        </details>
      </div>

      <ProjectsPipelineBoard initialProjects={projectItems} />
    </section>
  );
}
