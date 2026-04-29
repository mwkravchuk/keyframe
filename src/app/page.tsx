import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,color-mix(in_oklab,var(--accent)_16%,transparent),transparent_38%),radial-gradient(circle_at_88%_0%,color-mix(in_oklab,#8bbcff_8%,transparent),transparent_34%)]"
      />

      <header className="relative z-10 flex w-full items-center justify-between px-6 py-7 lg:px-14">
        <div className="text-lg font-semibold tracking-tight">Keyframe</div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-1 flex-col px-6 pb-14 pt-20 lg:px-14 lg:pt-28">
        <section className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Move from idea to publish with cinematic precision.
          </h1>
          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Keyframe gives creators a focused workflow from concept to script, shotlist,
            publishing, and review in a single command center.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:brightness-105"
            >
              Start with Keyframe
            </Link>
            <Link
              href="/app"
              className="rounded-md border border-border px-6 py-3 text-sm font-semibold transition hover:bg-muted"
            >
              Open app shell
            </Link>
          </div>
        </section>

        <section className="mt-20 border-y border-border">
          <div className="grid md:grid-cols-3 md:divide-x md:divide-border">
            {[
              "Ideation and concept stack",
              "Script and shotlist drafting",
              "Publishing and post-release review",
            ].map((item) => (
              <article key={item} className="px-0 py-5 text-sm text-muted-foreground md:px-6">
                <p className="max-w-56">{item}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
