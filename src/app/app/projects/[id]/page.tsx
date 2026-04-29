import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS, VIDEO_PROJECT_STAGES } from "@/lib/video-projects";
import { updateProjectAction } from "../actions";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

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

  const targetPublishAt = project.targetPublishAt
    ? project.targetPublishAt.toISOString().slice(0, 10)
    : "";

  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">{project.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Edit project details and stage.</p>

      <form action={updateProjectAction} className="mt-8 space-y-5 border-t border-border pt-6">
        <input type="hidden" name="id" value={project.id} />

        <div>
          <label htmlFor="title" className="text-xs text-muted-foreground">
            Title
          </label>
          <input
            id="title"
            name="title"
            defaultValue={project.title}
            required
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="stage" className="text-xs text-muted-foreground">
            Stage
          </label>
          <select
            id="stage"
            name="stage"
            defaultValue={project.stage}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {VIDEO_PROJECT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {VIDEO_PROJECT_STAGE_LABELS[stage]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="concept" className="text-xs text-muted-foreground">
            Concept
          </label>
          <textarea
            id="concept"
            name="concept"
            defaultValue={project.concept ?? ""}
            rows={4}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="notes" className="text-xs text-muted-foreground">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={project.notes ?? ""}
            rows={6}
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
            defaultValue={project.nextStep ?? ""}
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
            defaultValue={targetPublishAt}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
        >
          Save changes
        </button>
      </form>
    </section>
  );
}
