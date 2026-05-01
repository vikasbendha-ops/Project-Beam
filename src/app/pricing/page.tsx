import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing · Beam",
  description:
    "Simple, transparent pricing for visual feedback that ships. Free for solo work, paid plans add seats, history, and audit log.",
};

const TIERS: Array<{
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}> = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "For solo designers and one-off reviews.",
    features: [
      "5 active MarkUps",
      "3 collaborators",
      "Image, PDF & website review",
      "Public share links",
      "Realtime comments",
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "per workspace / month",
    blurb: "For working teams shipping every week.",
    features: [
      "Unlimited MarkUps",
      "10 collaborators",
      "Version history & approvals",
      "Realtime cursors",
      "Priority email support",
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$49",
    cadence: "per workspace / month",
    blurb: "For agencies and product teams at scale.",
    features: [
      "Everything in Pro",
      "50 collaborators",
      "Audit log retention 1 year",
      "SAML SSO (coming soon)",
      "Dedicated success manager",
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=team",
  },
];

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: "Can I switch plans later?",
    a: "Yes — upgrade or downgrade from Settings → Plan & billing at any time. Changes apply immediately, and we prorate the difference.",
  },
  {
    q: "What counts as a collaborator?",
    a: "Anyone you invite to your workspace as a member. Public share viewers and guest commenters are unlimited and don't count.",
  },
  {
    q: "Is there a self-host option?",
    a: "Not yet. We focus on Beam Cloud so we can ship faster. Talk to us if you have a hard self-host requirement.",
  },
  {
    q: "Do you offer a startup discount?",
    a: "We give 50% off Pro for two years to YC, Techstars, and similar program companies. Email us with proof of acceptance.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              B
            </span>
            <span className="text-base font-bold tracking-tight">Beam</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/help"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Help
            </Link>
            <Link
              href="/login"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="ml-2 rounded-md bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 pt-20 pb-12 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3 text-primary" />
          Pricing
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Pay for the team, not the click.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          One workspace price covers every reviewer, every guest, every share
          link. Reviewers and external commenters are always free.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 pb-16 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={
              tier.highlight
                ? "relative flex flex-col gap-5 rounded-3xl border-2 border-primary bg-card p-7 shadow-card-lg ring-2 ring-primary/20"
                : "flex flex-col gap-5 rounded-3xl border border-border bg-card p-7 shadow-card"
            }
          >
            {tier.highlight ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Most popular
              </span>
            ) : null}
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {tier.name}
              </h2>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-foreground">
                  {tier.price}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tier.cadence}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{tier.blurb}</p>
            </div>

            <ul className="flex flex-1 flex-col gap-2.5 text-sm text-foreground">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={tier.href}
              className={
                tier.highlight
                  ? "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  : "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              }
            >
              {tier.cta}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        ))}
      </section>

      <section className="border-t border-border/60 bg-muted/30 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Frequently asked
          </h2>
          <dl className="mt-8 space-y-6">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-sm font-semibold text-foreground">
                  {item.q}
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Beam. Made for teams that ship.</p>
          <div className="flex items-center gap-4">
            <Link href="/help" className="hover:text-foreground">
              Help
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
