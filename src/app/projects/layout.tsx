import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
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
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground transition hover:text-accent">
          Keyframe
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/projects" className="text-sm text-muted-foreground transition hover:text-foreground">
            Projects
          </Link>
          <ThemeToggle />
          <SignOutButton variant="inline" />
        </div>
      </header>

      <main className="w-full px-6 pb-10 lg:px-10 lg:pb-12">
        <div className="pt-8">{children}</div>
      </main>
    </div>
  );
}
