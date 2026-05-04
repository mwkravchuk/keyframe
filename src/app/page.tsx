import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS } from "@/lib/video-projects";
import type { VideoProjectStage } from "@/lib/video-projects";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";

const STAGE_COLORS: Record<VideoProjectStage, string> = {
  IDEA: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  DRAFTING: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  RECORDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  EDITING: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  REVIEW: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  PUBLISHED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const recentProjects = userId
    ? await prisma.videoProject.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 12,
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-6 py-5 lg:px-10">
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

      {/* Centered content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-20">
        {/* Input */}
        <section className="w-full max-w-xl">
          <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight text-foreground">
            What video do you want to make?
          </h1>

          <form>
            <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3.5 transition focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <input
                name="prompt"
                type="text"
                autoComplete="off"
                placeholder="Describe your idea…"
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              {!userId && (
                <Link
                  href="/login"
                  className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-accent-foreground transition hover:brightness-105"
                >
                  Sign in
                </Link>
              )}
            </div>
          </form>

          {userId && (
            <div className="mt-4 flex items-center justify-center gap-5">
              <Link
                href="/projects"
                className="text-xs text-muted-foreground transition hover:text-foreground"
              >
                New project manually
              </Link>
            </div>
          )}
        </section>

        {/* Recent projects — only when logged in and have projects */}
        {recentProjects.length > 0 && (
          <section className="mt-14 w-full max-w-3xl">
            <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group flex w-48 shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 transition hover:border-accent"
                >
                  <span
                    className={`inline-flex w-fit items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${STAGE_COLORS[project.stage as VideoProjectStage]}`}
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
