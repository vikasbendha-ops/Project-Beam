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
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      {/* Browser chrome */}
      <div className="flex h-10 items-center gap-2 border-b border-border bg-muted px-4">
        <div className="size-3 rounded-full bg-muted-foreground/30" />
        <div className="size-3 rounded-full bg-muted-foreground/30" />
        <div className="size-3 rounded-full bg-muted-foreground/30" />
        <div className="ml-3 h-6 flex-1 rounded-md border border-border bg-card" />
      </div>
      {/* Canvas area */}
      <div className="relative h-[calc(100%-2.5rem)] w-full bg-gradient-to-br from-muted via-card to-accent">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(28,25,23,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,25,23,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Pins */}
        <Pin n={1} top="28%" left="38%" />
        <Pin n={2} top="58%" left="68%">
          <CommentBubble />
        </Pin>
      </div>
    </div>
  );
}

function Pin({
  n,
  top,
  left,
  children,
}: {
  n: number;
  top: string;
  left: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="absolute" style={{ top, left }}>
      <div
        className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-primary text-xs font-semibold text-primary-foreground shadow-[0_2px_6px_rgba(28,25,23,0.18)]"
        aria-label={`Pin ${n}`}
      >
        {n}
      </div>
      {children}
    </div>
  );
}

function CommentBubble() {
  return (
    <div className="absolute left-1/2 top-10 z-10 w-64 -translate-x-1/2 rounded-[14px] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_4px_12px_rgba(28,25,23,0.05)]">
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          JD
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">
            Make this pop more
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Could we boost the contrast so the primary element stands out?
          </p>
        </div>
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
      body: "Stop guessing where the client means. Exact annotations on your mockups.",
    },
    {
      icon: Code2,
      kicker: "Developers",
      title: "Static-site review",
      body: "Drop a URL, Beam screenshots it. Pin issues directly on the rendered page.",
    },
    {
      icon: Brush,
      kicker: "Agencies",
      title: "Client sign-off, faster",
      body: "Share read-only links. Clients comment as guests — no signup required.",
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
            className="rounded-2xl border border-border bg-card p-8 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_4px_12px_rgba(28,25,23,0.05)]"
          >
            <div className="mb-4 flex items-center gap-2">
              <t.icon
                className="size-4 text-primary"
                strokeWidth={1.5}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-primary py-20 text-primary-foreground">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to ship feedback faster?
        </h2>
        <p className="mt-4 text-base leading-relaxed text-primary-foreground/80">
          Sign up in 30 seconds. Personal workspace ready instantly.
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-card text-primary hover:bg-card/90"
          >
            <Link href="/signup">Create your workspace</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <BeamWordmark className="text-base" />
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Faster feedback on websites, images, and PDFs.
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
