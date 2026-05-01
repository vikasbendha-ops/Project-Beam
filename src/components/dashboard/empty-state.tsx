"use client";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

/**
 * Dashboard empty state styled as a blueprint / drafting sheet. Hairline
 * grid, T-square crosshair, registration stamps. Sits inside the main app
 * shell so we keep the existing palette (Plus Jakarta) but lean into
 * structural drafting language.
 */
export function DashboardEmptyState() {
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);

  return (
    <section
      aria-label="Empty workspace"
      className="relative overflow-hidden rounded-2xl border-2 border-dashed border-foreground/40 bg-card"
      style={{ minHeight: 360 }}
    >
      {/* Blueprint grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(28,25,23,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Larger hairline grid every 5 cells */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(28,25,23,1) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,1) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
        }}
      />

      {/* Registration marks at corners */}
      <RegMark className="left-3 top-3" />
      <RegMark className="right-3 top-3" />
      <RegMark className="left-3 bottom-3" />
      <RegMark className="right-3 bottom-3" />

      {/* Title-block stamp top-left */}
      <div className="absolute left-6 top-6 hidden border-2 border-foreground bg-background/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
        <p>SHEET 01 / 01</p>
        <p className="mt-0.5">SCALE 1∶1</p>
        <p className="mt-0.5">REV. A</p>
      </div>

      {/* Title-block stamp top-right */}
      <div className="absolute right-6 top-6 hidden border-2 border-foreground bg-background/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:block">
        Workspace · Empty
      </div>

      {/* Crosshair (T-square) — runs full width/height through center */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px"
        style={{ background: "rgba(220, 38, 38, 0.55)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px"
        style={{ background: "rgba(220, 38, 38, 0.55)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-destructive/60"
      />

      {/* Center content */}
      <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          Origin · 0,0
        </p>
        <h2
          className="mt-4 font-bold tracking-tight text-foreground"
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            letterSpacing: "-0.02em",
          }}
        >
          A blank sheet.{" "}
          <span className="italic font-medium text-muted-foreground">
            Start drafting.
          </span>
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Drop in your first image, PDF, Office doc, or website URL. Pin
          comments anywhere on the canvas. Share with anyone — no login
          required.
        </p>

        {/* Specifications strip */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
          <li>· Image · PDF · Office</li>
          <li>· Website</li>
          <li>· Up to 50 MB</li>
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Button
            type="button"
            size="lg"
            onClick={() => setNewMarkupOpen(true)}
            className="font-mono text-[11px] uppercase tracking-[0.2em]"
          >
            ＋ Begin first MarkUp
          </Button>
          <a
            href="/help"
            className="text-xs italic text-muted-foreground underline decoration-foreground/30 decoration-2 underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary"
          >
            How does this work?
          </a>
        </div>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Drawn by you · {new Date().toLocaleDateString()}
        </p>
      </div>
    </section>
  );
}

function RegMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        "absolute font-mono text-base text-foreground/60 " + (className ?? "")
      }
    >
      +
    </span>
  );
}
