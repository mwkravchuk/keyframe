import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS } from "@/lib/video-projects";
import type { VideoProjectStage } from "@/lib/video-projects";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";

const STAGE_COLORS: Record<VideoProjectStage, string> = {
  IDEA: "text-sky-300 bg-sky-400/10 border-sky-400/25",
  DRAFTING: "text-violet-300 bg-violet-400/10 border-violet-400/25",
  RECORDING: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  EDITING: "text-orange-300 bg-orange-400/10 border-orange-400/25",
  REVIEW: "text-pink-300 bg-pink-400/10 border-pink-400/25",
  PUBLISHED: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const recentProjects = userId
    ? await prisma.videoProject.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <span className="text-sm font-semibold tracking-tight text-foreground">Keyframe</span>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {userId ? (
            <>
              <Link
                href="/projects"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Projects
              </Link>
              <SignOutButton variant="inline" />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-16 lg:px-10 lg:pb-20">
        <section className="flex w-full flex-1 flex-col justify-center">
          <h1 className="mb-2 text-center text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            Start your next video idea.
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Describe your concept—we'll help clarify it into something filmable.
          </p>

          <form>
            <div className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3.5 transition duration-150 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <input
                name="prompt"
                type="text"
                autoComplete="off"
                placeholder="What's your video idea? (any amount of vagueness is fine)"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border text-muted-foreground"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                >
                  <path
                    d="M5 12H19M19 12L13 6M19 12L13 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </form>

          {userId && (
            <div className="mt-4 flex items-center justify-center">
              <Link
                href="/projects"
                className="rounded-md px-6 py-2 text-sm font-semibold bg-accent transition duration-150 hover:opacity-90"
                style={{ color: "var(--accent-foreground)" }}
              >
                View projects
              </Link>
            </div>
          )}
        </section>

        {recentProjects.length > 0 && (
          <section className="mt-10 w-full border-t border-border pt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Projects</h2>
              <Link href="/projects" className="text-xs text-muted-foreground transition hover:text-foreground">
                View all
              </Link>
            </div>

            <div className="-mx-2 grid grid-cols-1 gap-3 px-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex min-h-28 flex-col gap-3 rounded-md border border-border bg-card p-4 transition duration-150 hover:border-accent"
                >
                  <span
                    className={`inline-flex w-fit items-center rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide ${STAGE_COLORS[project.stage as VideoProjectStage]}`}
                  >
                    {VIDEO_PROJECT_STAGE_LABELS[project.stage as VideoProjectStage]}
                  </span>
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition group-hover:text-accent">
                    {project.title}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
