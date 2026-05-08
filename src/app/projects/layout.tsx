import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { House } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";

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
      <div className="pointer-events-none fixed right-4 top-4 z-40">
        <div className="pointer-events-auto flex items-center gap-1 rounded-sm border border-border bg-background/90 p-1 shadow-lg shadow-black/10 backdrop-blur">
          <Link
            href="/"
            aria-label="Go to home"
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-card text-muted-foreground transition hover:text-foreground"
          >
            <House size={16} />
          </Link>

          <ThemeToggle />
          <SignOutButton variant="icon" />
        </div>
      </div>

      <main className="w-full px-6 pb-10 pt-4 lg:px-10 lg:pb-12">
        {children}
      </main>
    </div>
  );
}
