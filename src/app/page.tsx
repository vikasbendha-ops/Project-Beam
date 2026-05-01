import Link from "next/link";
import {
  Brush,
  CheckCircle2,
  Code2,
  MessageSquare,
  PenTool,
  UploadCloud,
} from "lucide-react";
import { BeamWordmark } from "@/components/shared/beam-mark";
import { Button } from "@/components/ui/button";

export default function MarketingLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <BuiltForTeams />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Beam home">
            <BeamWordmark />
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#teams"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Teams
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Sign up free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-32 pb-20 lg:px-8">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
            Faster feedback on websites, images, and PDFs.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Stop chasing feedback across emails and Slack threads. Beam lets
            you drop comments directly on your creative work, keeping your team
            aligned and moving faster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/signup">Start for free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs font-medium text-muted-foreground/80">
            Email + password sign-up. No credit card required.
          </p>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}

function HeroPreview() {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_60px_-15px_rgba(28,25,23,0.25),0_8px_24px_-8px_rgba(79,70,229,0.12)]">
      {/* Browser chrome */}
      <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
        <div className="size-2.5 rounded-full bg-rose-300/70" />
        <div className="size-2.5 rounded-full bg-amber-300/70" />
        <div className="size-2.5 rounded-full bg-emerald-300/70" />
        <div className="ml-2 flex h-5 flex-1 items-center justify-center rounded-md border border-border/60 bg-card text-[9px] font-medium text-muted-foreground">
          beam.app · landing-v3.png
        </div>
      </div>

      {/* App layout: comments rail + canvas */}
      <div className="grid h-[calc(100%-2.25rem)] grid-cols-[120px_1fr]">
        {/* Comments rail */}
        <aside className="hidden flex-col gap-2 border-r border-border bg-card p-2 sm:flex">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            2 active
          </p>
          <div className="rounded-md border border-primary/40 bg-primary/5 p-1.5">
            <div className="flex items-center gap-1">
              <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                1
              </span>
              <span className="truncate text-[9px] font-semibold text-foreground">
                Tighten kerning
              </span>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-1.5">
            <div className="flex items-center gap-1">
              <span className="flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                2
              </span>
              <span className="truncate text-[9px] font-semibold text-foreground">
                Make this pop
              </span>
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <div className="relative overflow-hidden bg-gradient-to-br from-muted via-card to-accent/40">
          {/* Decorative subject */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(28,25,23,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.06) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            {/* Mock content blocks suggesting a real screenshot */}
            <div className="absolute left-[18%] right-[18%] top-[18%] flex flex-col gap-2">
              <div className="h-3 w-2/3 rounded-full bg-foreground/15" />
              <div className="h-2 w-full rounded-full bg-foreground/10" />
              <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
            </div>
            <div className="absolute left-[18%] right-[18%] top-[48%] grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg bg-primary/15" />
              <div className="aspect-square rounded-lg bg-sky-200/40" />
              <div className="aspect-square rounded-lg bg-amber-200/40" />
            </div>
          </div>

          {/* Pin 1 */}
          <HeroPin n={1} top="28%" left="38%" />

          {/* Pin 2 + popover */}
          <div className="absolute" style={{ top: "58%", left: "68%" }}>
            <HeroPin n={2} />
            <div className="absolute left-9 top-0 w-52 rounded-[12px] border border-border bg-card p-2.5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_rgba(28,25,23,0.12)]">
              <div className="flex items-start gap-2">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  JD
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    Make this pop more
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                    Could we boost the contrast so it stands out?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status pill — matches the real canvas top-bar treatment */}
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
            <span className="size-1.5 rounded-full bg-sky-500" />
            Ready
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroPin({
  n,
  top,
  left,
}: {
  n: number;
  top?: string;
  left?: string;
}) {
  return (
    <div
      className="absolute"
      style={top || left ? { top, left } : undefined}
    >
      <div
        aria-label={`Pin ${n}`}
        className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground"
        style={{
          outline: "2px solid white",
          outlineOffset: -2,
          boxShadow:
            "0 0 0 3px rgba(79,70,229,0.18), 0 4px 10px rgba(28,25,23,0.22)",
        }}
      >
        {n}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: UploadCloud,
      title: "1. Upload",
      body: "Drop designs, PDFs, or website URLs. Beam creates a secure, shareable canvas instantly.",
    },
    {
      icon: MessageSquare,
      title: "2. Comment",
      body: "Click anywhere to drop a pin. Tag teammates, attach files, keep discussions contextual.",
    },
    {
      icon: CheckCircle2,
      title: "3. Approve",
      body: "Resolve feedback as you iterate. Clear status — Draft → Review → Approved — moves work forward.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="border-y border-border/60 bg-card py-24"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Streamline your review process
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            From first concept to final approval, without the email-thread
            headache.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
                <s.icon className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BuiltForTeams() {
  const teams = [
    {
      icon: PenTool,
      kicker: "Designers",
      title: "Pixel-perfect feedback",
      body: "Stop guessing where the client means. Exact annotations on your mockups and prototypes.",
      Decoration: () => (
        <div className="relative h-24 w-full overflow-hidden rounded-xl border border-border/60 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/15" />
          <div className="absolute left-3 top-3 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary text-[9px] font-bold text-primary-foreground shadow">
            1
          </div>
          <div className="absolute right-6 bottom-3 flex size-5 items-center justify-center rounded-full border-2 border-card bg-primary text-[9px] font-bold text-primary-foreground shadow">
            2
          </div>
        </div>
      ),
    },
    {
      icon: Code2,
      kicker: "Developers",
      title: "Live-site markup",
      body: "Paste any URL — Beam screenshots it and renders comments on the exact pixels you shipped.",
      Decoration: () => (
        <div className="flex h-24 w-full flex-col gap-2 overflow-hidden rounded-xl border border-border/60 bg-muted p-3">
          <div className="h-2 w-3/4 rounded-full bg-foreground/10" />
          <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
          <div className="h-2 w-full rounded-full bg-foreground/10" />
          <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
        </div>
      ),
    },
    {
      icon: Brush,
      kicker: "Marketing & Agencies",
      title: "PDF & asset review",
      body: "Collaborate on copy, campaigns, and final deliverables in one place. Guests comment without signup.",
      Decoration: () => (
        <div className="flex h-24 w-full items-center justify-center rounded-xl border border-border/60 bg-muted">
          <div className="flex size-14 items-center justify-center rounded-md border border-border bg-card shadow-sm">
            <FileTextIcon className="size-6 text-muted-foreground/70" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="teams" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Built for any team
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <div
            key={t.kicker}
            className="flex h-80 flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_4px_12px_rgba(28,25,23,0.05)] transition-colors hover:border-primary/30"
          >
            <div>
              <div className="mb-4 flex items-center gap-2">
                <t.icon
                  className="size-4 text-primary"
                  strokeWidth={1.5}
                />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.kicker}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t.body}
              </p>
            </div>
            <t.Decoration />
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[#EEF2FF] p-12 text-center sm:p-16">
        {/* Decorative blurs */}
        <div className="pointer-events-none absolute right-0 top-0 size-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 size-64 translate-y-1/2 -translate-x-1/2 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to ship feedback faster?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Sign up in 30 seconds. Personal workspace ready instantly. No
            credit card. No bots.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-md">
              <Link href="/signup">Get started for free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <BeamWordmark className="text-base" />
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/login" className="transition-colors hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="transition-colors hover:text-foreground">
            Sign up
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Privacy
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground">
            Terms
          </Link>
        </div>
        <p className="text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Beam. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}
