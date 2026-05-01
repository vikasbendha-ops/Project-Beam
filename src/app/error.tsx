"use client";

import { useEffect } from "react";
import Link from "next/link";

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
    <div className="editorial relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="grain absolute inset-0" />

      <Reg className="left-6 top-6" />
      <Reg className="right-6 top-6" />
      <Reg className="left-6 bottom-6" />
      <Reg className="right-6 bottom-6" />

      <article className="relative z-10 w-full max-w-[820px] border-2 border-[var(--rule)] bg-paper p-8 shadow-[6px_6px_0_0_var(--ink)] sm:p-12">
        <header className="flex items-center justify-between border-b-[3px] border-[var(--rule)] pb-4">
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            Beam · Incident slip · Form 5XX-B
          </p>
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            {new Date().toLocaleString()}
          </p>
        </header>

        <div className="mt-10 grid grid-cols-12 items-end gap-4 stagger">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Subject
          </p>
          <h1
            className="col-span-12 md:col-span-9 display"
            style={{
              fontSize: "clamp(72px, 12vw, 168px)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 0, 'WONK' 1",
              letterSpacing: "-0.04em",
              color: "var(--accent)",
            }}
          >
            Crash.
          </h1>
        </div>

        <div className="hairline-thick mt-6" />

        <div className="mt-8 grid grid-cols-12 items-baseline gap-4">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Status
          </p>
          <p
            className="col-span-12 md:col-span-9 display"
            style={{ fontSize: "clamp(28px, 4vw, 48px)" }}
          >
            The page hit an{" "}
            <span className="serif-italic">unexpected error</span>. The team has
            been notified.
          </p>
        </div>

        {error.digest ? (
          <div className="mt-6 grid grid-cols-12 gap-4">
            <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
              Reference
            </p>
            <p className="col-span-12 md:col-span-9 inline-flex items-center bg-ink px-3 py-2 mono text-[11px] tracking-[0.18em] uppercase w-fit">
              ref · {error.digest}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-12 gap-4">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Try
          </p>
          <ul className="col-span-12 md:col-span-9 space-y-2 text-[15px] leading-[1.6] ink-soft">
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ☑
              </span>
              Hit the retry button — the action might have been transient.
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ▢
              </span>
              Reload the whole page if retry doesn&rsquo;t resolve it.
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ▢
              </span>
              Email{" "}
              <a
                href={`mailto:support@beam.app${
                  error.digest ? `?subject=Incident%20${error.digest}` : ""
                }`}
                className="serif-italic accent underline decoration-[var(--accent)]/40 underline-offset-4"
              >
                support@beam.app
              </a>{" "}
              with the reference above.
            </li>
          </ul>
        </div>

        <div className="mt-12 grid grid-cols-12 items-end gap-6 border-t-[3px] border-[var(--rule)] pt-6">
          <div className="col-span-12 md:col-span-7 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={reset}
              className="press inline-flex items-center bg-accent px-5 py-2.5 text-[12px] smallcaps"
              style={{ color: "white" }}
            >
              ↻ Retry
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2.5 text-[12px] smallcaps ink underline decoration-[var(--rule)] decoration-2 underline-offset-4 hover:decoration-[var(--accent)]"
            >
              ← Return to home
            </Link>
          </div>
          <div className="col-span-12 md:col-span-5 md:text-right">
            <span
              className="inline-block rotate-[-6deg] border-[3px] border-[var(--accent)] px-3 py-2 mono text-[12px] tracking-[0.22em] uppercase"
              style={{ color: "var(--accent)" }}
            >
              Logged · {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>

        <footer className="mt-8 flex items-center justify-between border-t border-dotted border-[var(--rule)]/60 pt-3 mono text-[10px] tracking-[0.22em] uppercase ink-faint">
          <span>Incident routing · severity tbd</span>
          <span>Beam.app/error</span>
        </footer>
      </article>
    </div>
  );
}

function Reg({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={"absolute mono text-[18px] ink-faint " + (className ?? "")}
    >
      +
    </span>
  );
}
