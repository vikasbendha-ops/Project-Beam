"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WelcomeCarouselProps {
  firstName: string;
  workspaceId: string;
}

interface Step {
  id: string;
  plate: string;
  kicker: string;
  title: string;
  italicTitle?: string;
  blurb: string;
  caption: string;
  Visual: () => React.ReactNode;
}

/**
 * Welcome carousel rebuilt as a "Field Guide to Beam" — each step is a
 * plate from a naturalist's notebook with manuscript marks, hand-numbered
 * captions, and a marginal index. Persists progress in localStorage.
 */
export function WelcomeCarousel({
  firstName,
  workspaceId,
}: WelcomeCarouselProps) {
  const [step, setStep] = useState(0);
  const dashboardHref = `/w/${workspaceId}`;

  const steps: Step[] = [
    {
      id: "welcome",
      plate: "Plate I",
      kicker: "Recto",
      title: `Welcome, ${firstName}.`,
      italicTitle: "This is your field guide.",
      blurb:
        "Beam treats every comment like a specimen pinned to the work itself. No more screenshots. No more lost threads.",
      caption: "Fig. 01 · Pinned specimen, observed in the wild",
      Visual: VisualWelcome,
    },
    {
      id: "upload",
      plate: "Plate II",
      kicker: "Verso",
      title: "Bring anything",
      italicTitle: "to the slab.",
      blurb:
        "PNG, JPG, PDF, Word, Excel, PowerPoint, plain text, or paste a URL we'll auto-screenshot.",
      caption: "Fig. 02 · Permissible specimens · Mass < 50 MB",
      Visual: VisualUpload,
    },
    {
      id: "pin",
      plate: "Plate III",
      kicker: "Method",
      title: "Drop a pin,",
      italicTitle: "say something useful.",
      blurb:
        "Click the canvas to anchor a comment. Tag teammates with @. Mark resolved when shipped. Threads stream in realtime.",
      caption: "Fig. 03 · A pin in situ · Coordinates stored as percentages",
      Visual: VisualPin,
    },
    {
      id: "share",
      plate: "Plate IV",
      kicker: "Distribution",
      title: "Send the link.",
      italicTitle: "They comment without an account.",
      blurb:
        "Public share links · guests just type a name · invite teammates by email when you want to keep them around.",
      caption: "Fig. 04 · Range map · Reach is unlimited",
      Visual: VisualShare,
    },
  ];

  // Persist step + arrow navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("beam:welcome:step");
    if (saved && Number.isFinite(Number(saved))) {
      const n = Number(saved);
      if (n >= 0 && n < steps.length) setStep(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("beam:welcome:step", String(step));
    }
  }, [step]);

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function prev() {
    setStep((s) => Math.max(s - 1, 0));
  }
  function finish(href: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("beam:welcome:done", "1");
      window.localStorage.removeItem("beam:welcome:step");
    }
    window.location.assign(href);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <main className="editorial relative flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6 md:p-10">
      <div className="grain absolute inset-0" />

      <Reg className="left-4 top-4 sm:left-8 sm:top-8" />
      <Reg className="right-4 top-4 sm:right-8 sm:top-8" />
      <Reg className="left-4 bottom-4 sm:left-8 sm:bottom-8" />
      <Reg className="right-4 bottom-4 sm:right-8 sm:bottom-8" />

      <article className="relative z-10 w-full max-w-[1080px] border-2 border-[var(--rule)] bg-paper shadow-[8px_8px_0_0_var(--ink)]">
        {/* Top strip */}
        <header className="flex items-center justify-between border-b-[3px] border-[var(--rule)] px-6 py-2.5">
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            A field guide to Beam · Volume I
          </p>
          <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
            {current.plate} of {steps.length}
          </p>
        </header>

        <div className="grid grid-cols-12">
          {/* Marginal index */}
          <aside className="col-span-12 border-b border-[var(--rule)] px-6 py-5 md:col-span-3 md:border-b-0 md:border-r md:py-8">
            <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
              Index
            </p>
            <ol className="mt-4 space-y-3">
              {steps.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className="grid w-full grid-cols-[42px_1fr] items-baseline gap-2 text-left"
                  >
                    <span
                      className={
                        "mono text-[11px] tracking-[0.18em] " +
                        (i === step ? "accent" : "ink-faint")
                      }
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        "serif-italic text-[14px] " +
                        (i === step
                          ? "accent underline decoration-[var(--accent)]/40 underline-offset-4"
                          : i < step
                            ? "ink-soft line-through decoration-[var(--rule)]/30"
                            : "ink")
                      }
                    >
                      {s.title.replace(/\.$/, "").replace(/,$/, "")}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-10">
              <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
                Field notes
              </p>
              <p className="serif-italic mt-3 text-[14px] leading-[1.6] ink-soft">
                Use ← → to flip pages. Esc dismisses tooltips inside a
                MarkUp. Press <span className="mono ink">?</span> on the canvas
                for a full key.
              </p>
            </div>
          </aside>

          {/* Page body */}
          <div className="col-span-12 grid grid-cols-1 md:col-span-9 lg:grid-cols-2">
            {/* Visual plate */}
            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden border-b border-[var(--rule)] bg-paper-deep p-6 lg:border-b-0 lg:border-r">
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
              <span className="absolute left-3 top-3 mono text-[10px] tracking-[0.22em] uppercase ink-faint">
                {current.kicker} · {current.plate}
              </span>
              <span className="absolute right-3 top-3 mono text-[10px] tracking-[0.22em] uppercase ink-faint">
                Scale 1∶1
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 16, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
                  transition={{ duration: 0.4, ease: [0.22, 0.8, 0.2, 1] }}
                  className="relative z-10"
                >
                  <current.Visual />
                </motion.div>
              </AnimatePresence>

              <p className="absolute bottom-3 left-3 right-3 mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                {current.caption}
              </p>
            </div>

            {/* Text + actions */}
            <div className="flex min-h-[360px] flex-col justify-between p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id + "-text"}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
                    Article {String(step + 1).padStart(2, "0")} ·{" "}
                    {current.kicker}
                  </p>
                  <h1
                    className="display mt-3"
                    style={{ fontSize: "clamp(36px, 4.5vw, 60px)" }}
                  >
                    {current.title}
                    {current.italicTitle ? (
                      <>
                        {" "}
                        <span className="serif-italic accent">
                          {current.italicTitle}
                        </span>
                      </>
                    ) : null}
                  </h1>
                  <p className="mt-4 text-[15px] leading-[1.65] ink-soft">
                    {current.blurb}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Actions */}
              <div className="mt-8">
                {isLast ? (
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => finish(`${dashboardHref}?new=file`)}
                      className="press flex items-center justify-between bg-accent px-4 py-3 text-[12px] smallcaps"
                      style={{ color: "white" }}
                    >
                      <span>↑ Upload your first file</span>
                      <span className="mono">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => finish(`${dashboardHref}?new=website`)}
                      className="press flex items-center justify-between bg-ink px-4 py-3 text-[12px] smallcaps"
                    >
                      <span>⌖ Add a website URL</span>
                      <span className="mono">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => finish(dashboardHref)}
                      className="mt-1 self-start text-[12px] serif-italic ink-soft underline decoration-[var(--rule)]/40 underline-offset-4 hover:accent hover:decoration-[var(--accent)]"
                    >
                      I&rsquo;ll explore the dashboard first
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 border-t-[3px] border-[var(--rule)] pt-5">
                    <button
                      type="button"
                      onClick={() => finish(dashboardHref)}
                      className="text-[12px] serif-italic ink-soft underline decoration-[var(--rule)]/30 underline-offset-4 hover:accent hover:decoration-[var(--accent)]"
                    >
                      Skip the tour
                    </button>
                    <div className="flex items-center gap-1.5">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={prev}
                          className="inline-flex items-center px-3 py-2 text-[11px] smallcaps ink-soft hover:ink"
                        >
                          ← Back
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={next}
                        className="press inline-flex items-center bg-ink px-4 py-2 text-[11px] smallcaps"
                      >
                        Next plate →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page-foot ribbon */}
        <footer className="flex items-center justify-between border-t-[3px] border-[var(--rule)] px-6 py-2 mono text-[10px] tracking-[0.22em] uppercase ink-faint">
          <span>← → flip pages · Esc dismiss</span>
          <span>Beam.app/welcome</span>
        </footer>
      </article>

      <Link
        href={`/w/${workspaceId}`}
        className="absolute right-4 top-4 mono z-10 text-[10px] tracking-[0.22em] uppercase ink-faint underline decoration-[var(--rule)]/30 underline-offset-4 hover:ink sm:right-10 sm:top-10"
      >
        Skip →
      </Link>
    </main>
  );
}

function Reg({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={"absolute mono text-[16px] ink-faint " + (className ?? "")}
    >
      +
    </span>
  );
}

/* ──────────  Plates ────────── */

function VisualWelcome() {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.85, rotate: -3, opacity: 0 }}
        animate={{ scale: 1, rotate: -1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="relative flex size-44 items-center justify-center border-2 border-[var(--rule)] bg-paper shadow-[6px_6px_0_0_var(--ink)]"
      >
        {/* Centerpiece pin */}
        <div
          className="flex size-16 items-center justify-center rounded-full mono text-[20px] font-bold"
          style={{
            background: "var(--accent)",
            color: "white",
            outline: "3px solid var(--paper)",
            outlineOffset: -3,
            boxShadow: "0 0 0 8px rgba(255,77,26,0.18)",
          }}
        >
          1
        </div>
        {/* Hand-drawn arrow + label */}
        <span className="absolute -right-3 top-3 mono text-[9px] tracking-[0.18em] uppercase ink-faint">
          ← anchor
        </span>
        <span className="absolute -left-2 bottom-3 serif-italic accent text-[14px]">
          specimen.
        </span>
      </motion.div>
      <Sparkle className="-top-2 -right-2" delay={0.3} />
      <Sparkle className="-bottom-1 -left-3" delay={0.5} />
      <Sparkle className="top-1/2 -right-7" delay={0.7} />
    </div>
  );
}

function VisualUpload() {
  const items = [
    { label: "PNG", x: -100, y: -50, rot: -6 },
    { label: "PDF", x: 0, y: -80, rot: 4 },
    { label: "URL", x: 100, y: -50, rot: -3 },
    { label: "DOCX", x: -75, y: 30, rot: 5 },
    { label: "XLSX", x: 75, y: 30, rot: -4 },
    { label: "TXT", x: 0, y: 80, rot: 7 },
  ];
  return (
    <div className="relative size-56">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-[var(--rule)] bg-paper"
      >
        <p
          className="display"
          style={{ fontSize: 30, fontVariationSettings: "'opsz' 144, 'WONK' 1" }}
        >
          ⬇
        </p>
        <p className="mono mt-1 text-[10px] tracking-[0.22em] uppercase ink-soft">
          Drop or paste
        </p>
      </motion.div>
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ scale: 0, x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{
            scale: 1,
            x: it.x,
            y: it.y,
            opacity: 1,
            rotate: it.rot,
          }}
          transition={{
            delay: 0.1 + i * 0.08,
            type: "spring",
            stiffness: 200,
          }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mono inline-flex items-center bg-ink px-2 py-1 text-[10px] tracking-[0.22em] uppercase shadow-[3px_3px_0_0_var(--accent)]"
          style={{ color: "var(--paper)" }}
        >
          {it.label}
        </motion.div>
      ))}
    </div>
  );
}

function VisualPin() {
  return (
    <div className="relative aspect-[4/3] w-64 overflow-hidden border-2 border-[var(--rule)] bg-paper">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      {/* mock subject */}
      <div className="absolute left-[15%] right-[15%] top-[20%]">
        <div className="h-3 w-2/3 bg-[var(--ink)]" />
        <div className="mt-2 h-2 w-full bg-[var(--ink)]/30" />
        <div className="mt-1.5 h-2 w-5/6 bg-[var(--ink)]/30" />
      </div>

      {/* Pin 1 — resolved */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 380, damping: 18 }}
        className="absolute left-[32%] top-[28%] flex size-7 items-center justify-center rounded-full mono text-[11px] font-bold"
        style={{
          background: "var(--ink)",
          color: "white",
          outline: "2px solid var(--paper)",
          outlineOffset: -2,
        }}
      >
        1
      </motion.div>

      {/* Pin 2 + bubble */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 380, damping: 18 }}
        className="absolute left-[60%] top-[55%]"
      >
        <div
          className="flex size-8 items-center justify-center rounded-full mono text-[12px] font-bold"
          style={{
            background: "var(--accent)",
            color: "white",
            outline: "2px solid var(--paper)",
            outlineOffset: -2,
            boxShadow: "0 0 0 5px rgba(255,77,26,0.18)",
          }}
        >
          2
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.25 }}
          className="absolute left-12 top-0 w-44 border-2 border-[var(--rule)] bg-paper p-2.5 shadow-[3px_3px_0_0_var(--ink)]"
        >
          <p className="mono text-[9px] tracking-[0.22em] uppercase ink-faint">
            Comment №2
          </p>
          <p className="mt-1 text-[12px] leading-[1.4] ink">
            Make this <em className="serif-italic">pop</em> more.
          </p>
        </motion.div>
      </motion.div>

      <span className="absolute left-2 bottom-2 mono text-[9px] tracking-[0.18em] uppercase ink-faint">
        x: 60% · y: 55%
      </span>
    </div>
  );
}

function VisualShare() {
  const rows = [
    { label: "alex@team.io", state: "✓" },
    { label: "Public link · 7f3-c0n-91q", state: "✓" },
    { label: "client@brand.com", state: "✦" },
  ];
  return (
    <motion.div
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-64 border-2 border-[var(--rule)] bg-paper p-4 shadow-[6px_6px_0_0_var(--ink)]"
    >
      <div className="flex items-center justify-between border-b-[3px] border-[var(--rule)] pb-2">
        <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
          Distribution
        </p>
        <p className="mono text-[10px] tracking-[0.22em] uppercase ink-faint">
          3 / ∞
        </p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r, i) => (
          <motion.li
            key={r.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-dotted border-[var(--rule)]/40 pb-1.5"
          >
            <span className="mono truncate text-[11px] ink">{r.label}</span>
            <span
              className="mono text-[12px]"
              style={{
                color: r.state === "✓" ? "var(--ink)" : "var(--accent)",
              }}
            >
              {r.state}
            </span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 serif-italic text-[12px] ink-soft">
        Reach: <span className="accent">unlimited</span>.
      </p>
    </motion.div>
  );
}

function Sparkle({ className, delay }: { className?: string; delay: number }) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.85] }}
      transition={{ delay, duration: 0.6 }}
      aria-hidden
      className={
        "absolute mono text-[20px] " + (className ?? "")
      }
      style={{ color: "var(--accent)" }}
    >
      ✦
    </motion.span>
  );
}
