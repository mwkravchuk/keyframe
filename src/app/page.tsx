import Link from "next/link";
import { getServerSession } from "next-auth";
import { FolderKanban, Video, CircleCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_PROJECT_STAGE_LABELS, type VideoProjectStage } from "@/lib/video-projects";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { VideoIdeaBriefComposer } from "@/components/home/video-idea-brief-composer";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const userName = session?.user?.name?.trim() || "Creator";
  const userEmail = session?.user?.email?.trim() || "";
  const userImage = session?.user?.image?.trim() || null;
  const userInitial = userName[0]?.toUpperCase() || "K";

  const recentProjects = userId
    ? await prisma.videoProject.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 3,
      })
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,rgba(255,205,182,0.3),transparent_38%),radial-gradient(circle_at_84%_102%,rgba(241,124,130,0.1),transparent_52%)] dark:bg-[radial-gradient(circle_at_14%_-12%,rgba(148,30,58,0.34),transparent_40%),radial-gradient(circle_at_82%_102%,rgba(110,34,60,0.3),transparent_54%)]"
      />

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(220px,28%)_minmax(0,1fr)]">
        <div className="relative hidden border-r border-border/70 lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_26%_24%,rgba(255,188,164,0.34),transparent_44%),radial-gradient(ellipse_at_74%_76%,rgba(246,122,120,0.16),transparent_50%),linear-gradient(140deg,rgba(255,255,255,0.12),transparent_44%)] dark:bg-[radial-gradient(ellipse_at_22%_20%,rgba(156,24,56,0.44),transparent_46%),radial-gradient(ellipse_at_78%_74%,rgba(196,74,56,0.22),transparent_52%),linear-gradient(140deg,rgba(130,24,56,0.2),transparent_48%)]"
          />

          <div className="relative flex h-full flex-col px-6 pb-8 pt-8 xl:px-8">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-semibold tracking-tight text-foreground">Keyframe</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                <CircleCheck size={12} />
                Live
              </span>
            </div>

            <div className="pb-3">
              {userId ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-xs font-semibold text-foreground">
                    {userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userImage} alt={`${userName} avatar`} className="h-full w-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{userEmail || "Logged in"}</p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-foreground transition hover:opacity-75"
                >
                  <Video size={14} />
                  Sign in to continue
                </Link>
              )}
            </div>

            <div className="mt-4 grid gap-1.5 border-t border-border/70 pt-3">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2.5 px-0.5 py-1.5 text-sm text-foreground transition hover:opacity-75"
              >
                <FolderKanban size={16} className="text-foreground transition group-hover:opacity-75" />
                Open production board
              </Link>
            </div>

            {recentProjects.length > 0 ? (
              <section className="mt-5 border-t border-border/70 pt-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">Recent</h3>
                  <Link href="/projects" className="text-[11px] text-muted-foreground transition hover:text-foreground">
                    View all
                  </Link>
                </div>
                <div className="space-y-1">
                  {recentProjects.map((project, index) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="kf-reveal group flex items-start gap-2 px-0.5 py-1.5 text-sm text-foreground transition hover:opacity-75"
                      style={{ animationDelay: `${100 + index * 70}ms` }}
                    >
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/70 transition group-hover:bg-foreground" />
                      <span className="min-w-0">
                        <span className="line-clamp-1 block text-sm">{project.title}</span>
                        <span className="mt-0.5 block text-[10px] uppercase tracking-[0.09em] text-muted-foreground">
                          {VIDEO_PROJECT_STAGE_LABELS[project.stage as VideoProjectStage]}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-auto flex items-center justify-between border-t border-border/80 pt-4">
              <ThemeToggle />
              {userId ? <SignOutButton variant="inline" /> : null}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-12 lg:py-10 xl:px-16">
          <div className="mb-8 flex items-center justify-between gap-4 lg:hidden">
            <span className="text-sm font-semibold tracking-tight text-foreground">Keyframe</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {userId ? <SignOutButton variant="inline" /> : null}
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                What kind of video are you looking to create?
              </h2>
            </div>

            <div>
              <VideoIdeaBriefComposer isSignedIn={Boolean(userId)} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
