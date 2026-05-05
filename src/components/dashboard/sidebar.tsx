import Link from "next/link";
import { Clapperboard, FolderKanban, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";

const nav = [
  { href: "/projects", label: "Projects", icon: FolderKanban },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-full flex-col border-b border-border px-6 py-7 lg:border-b-0 lg:px-5">
      <div className="mb-10 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-accent">
            <Clapperboard size={16} />
          </div>
          <span className="text-base font-semibold tracking-tight">Keyframe</span>
        </div>
        <ThemeToggle />
      </div>

      <nav className="space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground"
          >
            <Icon size={16} className="text-muted-foreground group-hover:text-foreground" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="mb-2 flex items-center gap-2 font-medium tracking-wide text-foreground">
          <Settings size={14} />
          Workspace
        </div>
        <p>Auth, pipeline board, and publishing stages can be expanded from here.</p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
