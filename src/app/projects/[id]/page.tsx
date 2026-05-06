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

  const targetPublishAt = project.targetPublishAt
    ? project.targetPublishAt.toISOString().slice(0, 10)
    : "";

  return (
    <section className="mx-auto w-full max-w-3xl">
      <Link href="/projects" className="mb-4 inline-block text-xs text-muted-foreground transition hover:text-foreground">
        Back to board
      </Link>
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
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
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
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
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
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
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
            defaultValue={project.nextStep ?? ""}
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
            defaultValue={targetPublishAt}
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
        >
          Save changes
        </button>
      </form>
    </section>
  );
}
