"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquarePlus,
  Share2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WelcomeCarouselProps {
  firstName: string;
  workspaceId: string;
}

interface Step {
  id: string;
  title: string;
  blurb: string;
  Visual: () => React.ReactNode;
}

/**
 * Multi-step welcome tour shown after signup. Each step shows an
 * animated illustration + copy. Last step routes the user into a
 * dashboard with their first action (Upload file or Add URL) deep-linked.
 *
 * Progress is tracked in localStorage so a quick refresh doesn't reset
 * the tour, but users who want to redo it can clear `beam:welcome:done`.
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
      title: `Welcome to Beam, ${firstName}`,
      blurb:
        "Drop comments directly on websites, images, PDFs, and Office docs. Your team replies in context — no more screenshot threads.",
      Visual: VisualWelcome,
    },
    {
      id: "upload",
      title: "Upload anything",
      blurb:
        "PNG, JPG, PDF, Word, Excel, PowerPoint, plain text, or paste a URL we'll auto-screenshot.",
      Visual: VisualUpload,
    },
    {
      id: "pin",
      title: "Drop a pin, write a comment",
      blurb:
        "Click anywhere on the canvas to anchor feedback. Tag teammates with @, mark threads resolved when shipped.",
      Visual: VisualPin,
    },
    {
      id: "share",
      title: "Share with anyone",
      blurb:
        "Send a public link — guests comment without an account. Or invite teammates to your workspace by email.",
      Visual: VisualShare,
    },
  ];

  // Persist step so refresh doesn't lose progress.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("beam:welcome:step");
    if (saved && Number.isFinite(Number(saved))) {
      const n = Number(saved);
      if (n >= 0 && n < steps.length) setStep(n);
    }
    // intentional — only on mount.
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

  // Keyboard arrow nav.
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
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Step ${i + 1}: ${s.title}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                    ? "w-2 bg-primary/40"
                    : "w-2 bg-muted-foreground/20",
              )}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-[18px] border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="grid md:grid-cols-2">
            {/* Visual */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/30 md:aspect-auto md:min-h-[420px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-full w-full items-center justify-center p-8"
                >
                  <current.Visual />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Copy + actions */}
            <div className="flex min-h-[420px] flex-col justify-between p-8">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {step + 1} of {steps.length}
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {current.title}
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {current.blurb}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Actions */}
              {isLast ? (
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    size="lg"
                    onClick={() => finish(`${dashboardHref}?new=file`)}
                    className="justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UploadCloud className="size-4" />
                      Upload your first file
                    </span>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={() => finish(`${dashboardHref}?new=website`)}
                    className="justify-between"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Globe className="size-4" />
                      Add a website URL
                    </span>
                    <ArrowRight className="size-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={() => finish(dashboardHref)}
                    className="mt-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    I&rsquo;ll explore the dashboard first →
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => finish(dashboardHref)}
                    className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Skip tour
                  </button>
                  <div className="flex items-center gap-2">
                    {step > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={prev}
                      >
                        <ChevronLeft className="size-4" />
                        Back
                      </Button>
                    ) : null}
                    <Button type="button" size="sm" onClick={next}>
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          ← → arrows to navigate · Press Esc anywhere to dismiss tooltips
        </p>
      </div>
    </main>
  );
}

/* -------- Visuals (small motion-driven illustrations) -------- */

function VisualWelcome() {
  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="flex size-32 items-center justify-center rounded-[28px] bg-primary text-primary-foreground shadow-xl"
      >
        <MessageSquarePlus className="size-14" strokeWidth={1.5} />
      </motion.div>
      <Sparkle className="-top-3 -right-2" delay={0.3} />
      <Sparkle className="-bottom-1 -left-3" delay={0.5} />
      <Sparkle className="top-1/2 -right-8" delay={0.7} />
    </div>
  );
}

function VisualUpload() {
  const items = [
    { Icon: ImageIcon, label: "PNG / JPG", x: -90, y: -40, delay: 0.1 },
    { Icon: FileText, label: "PDF", x: 0, y: -70, delay: 0.2 },
    { Icon: Globe, label: "URL", x: 90, y: -40, delay: 0.3 },
    { Icon: FileText, label: "DOCX", x: -60, y: 30, delay: 0.4 },
    { Icon: FileText, label: "XLSX", x: 60, y: 30, delay: 0.5 },
  ];
  return (
    <div className="relative size-48">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-primary/40 bg-primary/5"
      >
        <UploadCloud className="size-10 text-primary" strokeWidth={1.5} />
        <p className="mt-2 text-xs font-semibold text-primary">Drop or paste</p>
      </motion.div>
      {items.map((it, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
          animate={{ scale: 1, x: it.x, y: it.y, opacity: 1 }}
          transition={{ delay: it.delay, type: "spring", stiffness: 200 }}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-md"
        >
          <it.Icon className="size-3 text-muted-foreground" strokeWidth={1.5} />
          {it.label}
        </motion.div>
      ))}
    </div>
  );
}

function VisualPin() {
  return (
    <div className="relative aspect-square w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-md">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-card to-accent/30" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Pin 1 */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 380, damping: 18 }}
        className="absolute left-[35%] top-[28%] flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-[11px] font-bold text-primary-foreground shadow-lg"
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
        <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-[11px] font-bold text-primary-foreground shadow-lg">
          2
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.25 }}
          className="absolute left-10 top-0 w-40 rounded-[10px] border border-border bg-card p-2.5 shadow-lg"
        >
          <p className="text-[10px] font-semibold text-foreground">
            Make this pop
          </p>
          <p className="mt-1 text-[9px] leading-relaxed text-muted-foreground">
            Bump the contrast so it stands out from the rest.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function VisualShare() {
  return (
    <div className="relative w-56">
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border border-border bg-card p-4 shadow-lg"
      >
        <div className="mb-3 flex items-center gap-2">
          <Share2 className="size-4 text-primary" strokeWidth={1.5} />
          <p className="text-xs font-semibold text-foreground">Share MarkUp</p>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "alex@team.io", invited: true },
            { label: "Public link", invited: true },
            { label: "client@brand.com", invited: false },
          ].map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12 }}
              className="flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-1.5"
            >
              <span className="truncate text-[11px] text-foreground">
                {row.label}
              </span>
              {row.invited ? (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              ) : (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Send
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Sparkle({ className, delay }: { className?: string; delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0.85] }}
      transition={{ delay, duration: 0.6 }}
      className={cn(
        "absolute size-3 rounded-full bg-primary/60 shadow-[0_0_12px_rgba(79,70,229,0.6)]",
        className,
      )}
    />
  );
}
