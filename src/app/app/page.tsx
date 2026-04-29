import Link from "next/link";

export default function AppHomePage() {
  return (
    <section className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Welcome to Keyframe</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        This workspace is ready for the production flow from ideation to review.
      </p>

      <div className="mt-10 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          Next step: manage your projects through each production stage.
        </p>
        <Link
          href="/app/projects"
          className="mt-4 inline-block rounded-md border border-border px-4 py-2 text-sm text-foreground transition hover:bg-muted"
        >
          Open projects
        </Link>
      </div>
    </section>
  );
}
