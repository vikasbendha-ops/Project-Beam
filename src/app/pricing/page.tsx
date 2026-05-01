import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing · Beam",
  description:
    "Itemised pricing for visual feedback that ships. One workspace price, unlimited reviewers, no per-seat tax on guests.",
};

const TIERS = [
  {
    sku: "FREE-001",
    name: "Free",
    price: "$0.00",
    cadence: "/forever",
    blurb: "Personal workspace · 5 active MarkUps · 3 collaborators.",
    items: [
      ["Active MarkUps", "5"],
      ["Collaborators (members)", "3"],
      ["Public share links", "unlimited"],
      ["Guest commenters", "unlimited"],
      ["Realtime threads", "✓"],
      ["Office docs & PDFs", "✓"],
      ["Version history", "✓"],
      ["Audit log retention", "30 days"],
    ],
    cta: "Start free",
    href: "/signup",
  },
  {
    sku: "PRO-019",
    name: "Pro",
    price: "$19.00",
    cadence: "/workspace · month",
    blurb: "For working teams shipping every week.",
    items: [
      ["Active MarkUps", "unlimited"],
      ["Collaborators (members)", "10"],
      ["Public share links", "unlimited"],
      ["Guest commenters", "unlimited"],
      ["Realtime cursors", "✓"],
      ["Approvals & versions", "✓"],
      ["Audit log retention", "180 days"],
      ["Priority email support", "✓"],
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    sku: "TEAM-049",
    name: "Team",
    price: "$49.00",
    cadence: "/workspace · month",
    blurb: "For agencies & product teams at scale.",
    items: [
      ["Everything in Pro", "✓"],
      ["Collaborators (members)", "50"],
      ["SAML SSO", "soon"],
      ["SCIM provisioning", "soon"],
      ["Audit log retention", "1 year"],
      ["Dedicated success mgr", "✓"],
      ["Custom domain on share links", "soon"],
      ["Onboarding session", "✓"],
    ],
    cta: "Start 14-day trial",
    href: "/signup?plan=team",
  },
];

const FAQ = [
  {
    q: "Switch plans later?",
    a: "Yes. Settings → Plan & billing. Upgrades apply immediately, downgrades at the end of the billing period.",
  },
  {
    q: "What counts as a collaborator?",
    a: "Anyone you invite as a workspace member. Public share viewers and guest commenters are unlimited and never count.",
  },
  {
    q: "Self-host?",
    a: "Not yet. Beam is cloud-only so we can ship faster. Reach out if you have a hard self-host requirement.",
  },
  {
    q: "Startup discount?",
    a: "50% off Pro for two years for YC, Techstars, and similar program companies. Email proof of acceptance.",
  },
];

export default function PricingPage() {
  const today = new Date();
  const order = "BM-" + String(today.getTime()).slice(-8);

  return (
    <div className="editorial relative min-h-screen overflow-hidden">
      <div className="grain absolute inset-0" />

      {/* Top stamp bar */}
      <header className="relative z-10 border-b-[3px] border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3 lg:px-8">
          <Link
            href="/"
            className="mono text-[10px] tracking-[0.18em] uppercase ink-soft hover:ink"
          >
            ← Beam · Index
          </Link>
          <div className="mono flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase ink-faint">
            <span>Quote nº {order}</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              {today.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Receipt headline */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pt-14 pb-10 lg:px-8">
        <div className="grid grid-cols-12 items-end gap-6 stagger">
          <div className="col-span-12 md:col-span-3">
            <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
              Section
            </p>
            <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-soft">
              The price
            </p>
          </div>
          <h1
            className="col-span-12 md:col-span-9 display"
            style={{ fontSize: "clamp(56px, 8.5vw, 132px)" }}
          >
            Pay for the team.{" "}
            <span className="serif-italic accent">Not the click.</span>
          </h1>
        </div>
        <div className="hairline-thick mt-10" />
        <p className="mt-4 grid grid-cols-12 gap-6 text-[14px] ink-soft">
          <span className="col-span-12 md:col-span-3 mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Lede
          </span>
          <span className="col-span-12 md:col-span-9">
            One workspace price covers every reviewer, every guest, every share
            link. Reviewers and external commenters are{" "}
            <em className="serif-italic">always</em> free. No per-seat tax on
            people who don&rsquo;t live in the tool.
          </span>
        </p>
      </section>

      {/* The receipt — three columns */}
      <section className="relative z-10 mx-auto max-w-[1180px] px-6 pb-20 lg:px-8">
        <div className="grid gap-0 md:grid-cols-3">
          {TIERS.map((t, idx) => (
            <ReceiptColumn key={t.sku} tier={t} idx={idx} />
          ))}
        </div>

        {/* Perforated edge strip */}
        <Perforated />

        {/* Subtotal block */}
        <div className="mt-12 grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-5">
            <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
              Total billed
            </p>
            <p
              className="display mt-2"
              style={{ fontSize: "clamp(40px, 5vw, 76px)" }}
            >
              $0.00 to begin.
            </p>
            <p className="mt-2 text-[14px] ink-soft">
              No card. No bots. The{" "}
              <em className="serif-italic">first MarkUp</em> ships before the
              receipt is printed.
            </p>
          </div>
          <div className="col-span-12 md:col-span-7 flex md:items-end md:justify-end">
            <Link
              href="/signup"
              className="press inline-flex items-center bg-accent px-8 py-4 text-[14px] smallcaps"
              style={{ color: "white" }}
            >
              Print this quote / Sign up →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ — manuscript Q&A */}
      <section className="relative z-10 border-t-[3px] border-[var(--rule)] bg-paper-deep py-20">
        <div className="mx-auto max-w-[1180px] px-6 lg:px-8">
          <div className="grid grid-cols-12 items-end gap-6 mb-12">
            <p className="col-span-12 md:col-span-3 mono text-[10px] tracking-[0.18em] uppercase ink-faint">
              Marginalia · FAQ
            </p>
            <h2
              className="col-span-12 md:col-span-9 display"
              style={{ fontSize: "clamp(40px, 5.5vw, 84px)" }}
            >
              Frequently <span className="serif-italic">asked</span>.
            </h2>
          </div>
          <ol className="grid grid-cols-12 gap-6">
            {FAQ.map((it, i) => (
              <li
                key={it.q}
                className="col-span-12 md:col-span-6 grid grid-cols-[40px_1fr] gap-4 border-t border-[var(--rule)] pt-5"
              >
                <span
                  className="mono text-[12px] tracking-[0.18em]"
                  style={{ color: "var(--accent)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className="display"
                    style={{ fontSize: "clamp(22px, 2vw, 30px)" }}
                  >
                    {it.q}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.6] ink-soft">
                    {it.a}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Footer slip */}
      <footer className="relative z-10 border-t border-[var(--rule)] py-8">
        <div className="mx-auto flex max-w-[1180px] flex-col items-center justify-between gap-3 px-6 lg:px-8 sm:flex-row">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            © {today.getFullYear()} Beam · Quote nº {order}
          </p>
          <div className="mono flex items-center gap-4 text-[10px] tracking-[0.18em] uppercase">
            <Link href="/" className="ink-soft hover:ink">
              Home
            </Link>
            <Link href="/help" className="ink-soft hover:ink">
              Help
            </Link>
            <Link href="/login" className="ink-soft hover:ink">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ReceiptColumn({
  tier,
  idx,
}: {
  tier: (typeof TIERS)[number];
  idx: number;
}) {
  const featured = tier.featured;
  const lastIdx = TIERS.length - 1;
  return (
    <div
      className={
        "relative flex flex-col p-7 md:p-8 " +
        (featured
          ? "bg-ink"
          : idx % 2 === 0
            ? "bg-paper"
            : "bg-paper-deep") +
        " border-2 border-[var(--rule)]" +
        (idx > 0 ? " md:-ml-[2px]" : "") +
        (idx > 0 && idx < lastIdx ? "" : "")
      }
      style={featured ? { color: "var(--paper)" } : undefined}
    >
      {/* SKU + heading */}
      <div className="flex items-baseline justify-between">
        <span
          className="mono text-[10px] tracking-[0.18em] uppercase"
          style={{ color: featured ? "var(--accent)" : "var(--ink-faint)" }}
        >
          SKU {tier.sku}
        </span>
        {featured ? (
          <span
            className="mono inline-flex items-center rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] tracking-[0.18em] uppercase"
            style={{ color: "white" }}
          >
            Recommended
          </span>
        ) : null}
      </div>
      <h3
        className="display mt-3"
        style={{
          fontSize: "clamp(40px, 4vw, 64px)",
          fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'WONK' 1",
        }}
      >
        {tier.name}
      </h3>
      <p
        className="mt-1 text-[12px] leading-[1.5]"
        style={{ color: featured ? "rgba(242,237,227,0.8)" : "var(--ink-soft)" }}
      >
        {tier.blurb}
      </p>

      <div className="hairline mt-5 pt-5">
        <div className="flex items-baseline gap-2">
          <span
            className="mono"
            style={{ fontSize: "clamp(36px, 3.6vw, 56px)", lineHeight: 1 }}
          >
            {tier.price}
          </span>
          <span
            className="mono text-[11px] tracking-[0.16em] uppercase"
            style={{ color: featured ? "rgba(242,237,227,0.7)" : "var(--ink-faint)" }}
          >
            {tier.cadence}
          </span>
        </div>
      </div>

      {/* Itemised list */}
      <ul className="mt-6 flex-1 space-y-2">
        {tier.items.map(([k, v]) => (
          <li
            key={k}
            className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-dotted border-current/20 pb-1.5 mono text-[12px] tracking-[0.04em]"
          >
            <span style={{ opacity: featured ? 0.85 : 0.85 }}>{k}</span>
            <span
              style={{
                color: v === "soon" ? "var(--ink-faint)" : undefined,
                fontWeight: featured ? 500 : 600,
              }}
            >
              {v}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.href}
        className={
          "mt-7 press inline-flex items-center justify-center px-5 py-3 text-[12px] smallcaps " +
          (featured ? "bg-accent" : "bg-ink")
        }
        style={{ color: "white" }}
      >
        {tier.cta} →
      </Link>
    </div>
  );
}

function Perforated() {
  return (
    <div
      aria-hidden
      className="relative my-10 h-3"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--rule) 1px, transparent 1.5px)",
        backgroundSize: "10px 10px",
        backgroundRepeat: "repeat-x",
        backgroundPosition: "center",
      }}
    />
  );
}
