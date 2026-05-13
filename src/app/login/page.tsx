import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_-8%,rgba(255,205,182,0.3),transparent_38%),radial-gradient(circle_at_84%_102%,rgba(241,124,130,0.1),transparent_52%)] dark:bg-[radial-gradient(circle_at_14%_-12%,rgba(148,30,58,0.34),transparent_40%),radial-gradient(circle_at_82%_102%,rgba(110,34,60,0.3),transparent_54%)]"
      />

      <section className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden border-r border-border/70 lg:block">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_26%_24%,rgba(255,188,164,0.34),transparent_44%),radial-gradient(ellipse_at_74%_76%,rgba(246,122,120,0.16),transparent_50%),linear-gradient(140deg,rgba(255,255,255,0.12),transparent_44%)] dark:bg-[radial-gradient(ellipse_at_22%_20%,rgba(156,24,56,0.44),transparent_46%),radial-gradient(ellipse_at_78%_74%,rgba(196,74,56,0.22),transparent_52%),linear-gradient(140deg,rgba(130,24,56,0.2),transparent_48%)]"
          />

          <div className="relative flex h-full items-end p-12">
            <div className="space-y-4">
              <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight text-foreground">
                Focused creator workflow.
              </h1>
            </div>
          </div>
        </div>

        <div className="relative flex items-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="absolute right-6 top-6 sm:right-10 lg:right-16">
            <ThemeToggle />
          </div>

          <div className="mx-auto w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Log in to Keyframe</h2>
            <p className="mt-2 text-sm text-muted-foreground">Continue with Google to access your workspace.</p>

            <GoogleSignInButton className="mt-8" />

            <Link href="/" className="mt-6 inline-block text-sm text-muted-foreground transition hover:text-foreground">
              Back to landing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
