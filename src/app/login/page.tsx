import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-6 py-7 lg:px-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_36%)]"
      />

      <header className="relative z-10 flex w-full items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Keyframe
        </Link>
        <ThemeToggle />
      </header>

      <section className="relative z-10 mx-auto mt-24 w-full max-w-md border-t border-border pt-10">
        <h1 className="text-3xl font-semibold tracking-tight">Log in</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to access your creator workflow workspace.
        </p>

        <GoogleSignInButton />

        <Link
          href="/"
          className="mt-5 inline-block text-sm text-muted-foreground transition hover:text-foreground"
        >
          Back to landing
        </Link>
      </section>
    </main>
  );
}
