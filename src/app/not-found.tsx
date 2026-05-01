import Link from "next/link";

export const metadata = {
  title: "Not found · Beam",
};

export default function NotFound() {
  return (
    <div className="editorial relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <div className="grain absolute inset-0" />

      {/* Registration marks at corners */}
      <Reg className="left-6 top-6" />
      <Reg className="right-6 top-6" />
      <Reg className="left-6 bottom-6" />
      <Reg className="right-6 bottom-6" />

      <article className="relative z-10 w-full max-w-[820px] border-2 border-[var(--rule)] bg-paper p-8 shadow-[6px_6px_0_0_var(--ink)] sm:p-12">
        {/* Slip header */}
        <header className="flex items-center justify-between border-b-[3px] border-[var(--rule)] pb-4">
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            Beam · System slip · Form 404-A
          </p>
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            Filed {new Date().toLocaleDateString("en-GB")}
          </p>
        </header>

        {/* Big tag */}
        <div className="mt-10 grid grid-cols-12 items-end gap-4 stagger">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Subject
          </p>
          <h1
            className="col-span-12 md:col-span-9 display"
            style={{
              fontSize: "clamp(96px, 18vw, 240px)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 0, 'WONK' 1",
              letterSpacing: "-0.04em",
              color: "var(--accent)",
            }}
          >
            404
          </h1>
        </div>

        <div className="hairline-thick mt-6" />

        <div className="mt-8 grid grid-cols-12 items-baseline gap-4">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Status
          </p>
          <p
            className="col-span-12 md:col-span-9 display"
            style={{ fontSize: "clamp(32px, 4.6vw, 64px)" }}
          >
            We can&rsquo;t find{" "}
            <span className="serif-italic">that page.</span>
          </p>
        </div>

        <div className="mt-6 grid grid-cols-12 gap-4">
          <p className="col-span-12 md:col-span-3 mono text-[11px] tracking-[0.22em] uppercase ink-faint">
            Likely cause
          </p>
          <ul className="col-span-12 md:col-span-9 space-y-2 text-[15px] leading-[1.6] ink-soft">
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ▢
              </span>
              The link is broken or mistyped.
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ▢
              </span>
              The MarkUp was deleted or moved to trash.
            </li>
            <li className="flex items-baseline gap-3">
              <span className="mono text-[11px] tracking-[0.18em] ink-faint">
                ☑
              </span>
              The workspace was renamed or you don&rsquo;t have access.
            </li>
          </ul>
        </div>

        {/* Stamp + actions */}
        <div className="mt-12 grid grid-cols-12 items-end gap-6 border-t-[3px] border-[var(--rule)] pt-6">
          <div className="col-span-12 md:col-span-7 flex flex-wrap gap-2.5">
            <Link
              href="/"
              className="press inline-flex items-center bg-ink px-5 py-2.5 text-[12px] smallcaps"
            >
              ← Return to home
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center px-4 py-2.5 text-[12px] smallcaps ink underline decoration-[var(--rule)] decoration-2 underline-offset-4 hover:decoration-[var(--accent)]"
            >
              Visit help center
            </Link>
          </div>
          <div className="col-span-12 md:col-span-5 md:text-right">
            <Stamp />
          </div>
        </div>

        {/* Footer ribbon */}
        <footer className="mt-8 flex items-center justify-between border-t border-dotted border-[var(--rule)]/60 pt-3 mono text-[10px] tracking-[0.22em] uppercase ink-faint">
          <span>Routing slip / not for replication</span>
          <span>Beam.app/404</span>
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

function Stamp() {
  return (
    <span
      className="inline-block rotate-[-6deg] border-[3px] border-[var(--accent)] px-3 py-2 mono text-[12px] tracking-[0.22em] uppercase"
      style={{ color: "var(--accent)" }}
    >
      Page · void
    </span>
  );
}
