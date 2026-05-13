import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Clapperboard, House, LayoutGrid } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PageShell } from "@/components/ui/page-shell";

export default async function ProjectsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-soft">
                <Clapperboard size={15} />
              </span>
              <span className="text-sm font-semibold tracking-tight text-foreground">Keyframe</span>
            </div>

            <nav className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/projects"
                aria-current="page"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                <LayoutGrid size={14} />
                Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:text-foreground"
              >
                <House size={14} />
                Generator
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton variant="icon" />
          </div>
        </div>
      </header>

      <PageShell>{children}</PageShell>
    </div>
  );
}
