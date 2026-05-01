"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-7" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
          Something broke
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          We hit an unexpected error
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page you were viewing crashed. The team has been notified. Try
          again or return home.
        </p>
        {error.digest ? (
          <p className="mt-4 inline-block rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            ref · {error.digest}
          </p>
        ) : null}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RotateCcw className="size-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
