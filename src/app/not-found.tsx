import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export const metadata = {
  title: "Not found · Beam",
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-7" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          We can&rsquo;t find that page
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The link may be broken, or the MarkUp / workspace was moved or
          deleted. Head back and try again.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Visit help center
          </Link>
        </div>
      </div>
    </main>
  );
}
