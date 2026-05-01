import Link from "next/link";

const ISSUE = String(
  Math.floor(
    (Date.now() - new Date("2025-01-01").getTime()) / 86_400_000,
  ),
).padStart(3, "0");

const TICKER_ITEMS = [
  "PIN-DROP REVIEW",
  "NO MORE SCREENSHOTS IN SLACK",
  "VOL. I",
  "ISSUE Nº " + ISSUE,
  "GUEST COMMENTS",
  "NO LOGIN",
  "REALTIME OR NOTHING",
  "FOR DESIGNERS · PMs · WRITERS",
];

export default function MarketingLanding() {
  return (
    <div className="editorial relative min-h-screen overflow-hidden">
      <div className="grain absolute inset-0" />
      <Masthead />
      <Ticker />
      <HeroLead />
      <DropCapLead />
      <Specimen />
      <Manifesto />
      <Bento />
      <ClosingFold />
      <Colophon />
    </div>
  );
}

/* ─────────────────────────  MASTHEAD  ───────────────────────── */

function Masthead() {
  return (
    <header className="relative z-10 border-b-[3px] border-[var(--rule)]">
      <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-6 pt-5 pb-3 lg:px-10">
        <div className="flex items-baseline gap-4">
          <span className="mono text-[10px] tracking-[0.18em] uppercase ink-soft">
            Vol. I · № {ISSUE}
          </span>
          <span className="hidden text-[10px] mono uppercase tracking-[0.18em] ink-soft md:inline">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <nav className="flex items-center gap-1 text-[12px]">
          <Link
            href="/help"
            className="px-2 py-1 smallcaps ink-soft transition-colors hover:ink"
          >
            Help
          </Link>
          <Link
            href="/pricing"
            className="px-2 py-1 smallcaps ink-soft transition-colors hover:ink"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="px-2 py-1 smallcaps ink-soft transition-colors hover:ink"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="press ml-2 inline-flex items-center bg-ink px-3.5 py-1.5 text-[11px] smallcaps"
          >
            Begin →
          </Link>
        </nav>
      </div>

      {/* Title slab */}
      <div className="mx-auto max-w-[1320px] px-6 pb-2 lg:px-10">
        <h1
          className="display flex items-baseline justify-between gap-4 pb-2"
          style={{ fontSize: "clamp(72px, 13vw, 196px)" }}
        >
          <span className="display-tight">B</span>
          <span className="display-tight ink">e</span>
          <span className="serif-italic accent" style={{ fontStyle: "italic" }}>
            a
          </span>
          <span className="display-tight ink">m</span>
          <span className="ml-auto hidden mono self-end pb-3 text-[10px] uppercase tracking-[0.2em] ink-faint sm:inline">
            n. /biːm/ — a beam of light. a directed signal.
          </span>
        </h1>
        <div className="hairline mt-1" />
        <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-soft">
          The visual-feedback gazette · Established for teams who hate
          screenshot threads
        </p>
      </div>
    </header>
  );
}

/* ─────────────────────────  TICKER  ───────────────────────── */

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  return (
    <div className="relative z-10 border-b-[3px] border-[var(--rule)] bg-ink overflow-hidden">
      <div className="ticker-track flex w-max items-center gap-10 py-2.5">
        {items.map((it, i) => (
          <span
            key={i}
            className="mono text-[11px] tracking-[0.22em] uppercase whitespace-nowrap"
            style={{ color: i % 8 === 2 ? "var(--accent)" : "var(--paper)" }}
          >
            {it}
            <span className="ml-10 ink-faint">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────  HERO  ───────────────────────── */

function HeroLead() {
  return (
    <section className="relative z-10 mx-auto max-w-[1320px] px-6 py-12 lg:px-10 lg:py-20">
      <div className="grid grid-cols-12 gap-6 stagger">
        <div className="col-span-12 md:col-span-2 lg:col-span-1">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Lede
          </p>
          <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-faint">
            № 01
          </p>
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-7">
          <h2
            className="display"
            style={{ fontSize: "clamp(48px, 6.5vw, 96px)" }}
          >
            Stop chasing feedback{" "}
            <span className="serif-italic accent">across</span> emails,
            screenshots, and Slack threads of doom.
          </h2>
        </div>
        <div className="col-span-12 md:col-span-3 lg:col-span-4">
          <div className="mb-3 hairline-thick" />
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-soft">
            By the editors
          </p>
          <p className="mt-3 text-[15px] leading-[1.55] ink-soft">
            Beam is a single, opinionated tool for visual review. You drop pins
            on the work. People reply <em className="serif-italic">in place</em>.
            Nothing escapes. Nothing rots in a thread.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              href="/signup"
              className="press inline-flex items-center bg-accent px-5 py-2.5 text-[13px] smallcaps"
              style={{ color: "white" }}
            >
              Start a workspace
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-5 py-2.5 text-[13px] smallcaps ink underline decoration-[var(--rule)] decoration-2 underline-offset-4 hover:decoration-[var(--accent)]"
            >
              I have an account
            </Link>
          </div>
          <p className="mono mt-3 text-[10px] tracking-[0.16em] uppercase ink-faint">
            Free to start · No card · No bots
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  DROP-CAP LEAD  ───────────────────────── */

function DropCapLead() {
  return (
    <section className="relative z-10 border-y border-[var(--rule)]/60 py-14">
      <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-8 px-6 lg:px-10">
        <aside className="col-span-12 md:col-span-3">
          <div className="hairline-thick mb-3" />
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Filed under
          </p>
          <ul className="mt-2 space-y-1 text-[12px] ink-soft">
            <li>
              <span className="mono">001</span> Pinned comments
            </li>
            <li>
              <span className="mono">002</span> Realtime cursors
            </li>
            <li>
              <span className="mono">003</span> Approvals
            </li>
            <li>
              <span className="mono">004</span> Guests, no login
            </li>
            <li>
              <span className="mono">005</span> Office docs &amp; PDFs
            </li>
          </ul>
        </aside>
        <div className="col-span-12 md:col-span-9">
          <p
            className="drop-cap text-[18px] leading-[1.7] ink"
            style={{ maxWidth: "62ch" }}
          >
            On any given Tuesday, the design team will produce twelve revisions,
            three explorations, and a single immortal Slack thread titled
            &ldquo;quick eyes?&rdquo;. The thread will branch, die, resurrect,
            and finally be lost beneath a meme. Beam treats this as a
            <em className="serif-italic accent"> design failure</em>, not a
            cultural one. Fix the surface, not the people. We built a tool
            where the comment lives on the pixel it&rsquo;s about — and the
            pixel keeps being the source of truth.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  SPECIMEN  ───────────────────────── */

function Specimen() {
  return (
    <section className="relative z-10 mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
      <div className="mb-10 grid grid-cols-12 items-end gap-6">
        <div className="col-span-12 md:col-span-3">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Plate I
          </p>
          <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-soft">
            Anatomy of a pin
          </p>
        </div>
        <h3
          className="display col-span-12 md:col-span-9"
          style={{ fontSize: "clamp(38px, 5vw, 76px)" }}
        >
          The smallest unit of feedback{" "}
          <span className="serif-italic ink-soft">— a single dot.</span>
        </h3>
      </div>

      <div className="relative grid grid-cols-12 gap-6">
        {/* Specimen plate */}
        <div className="col-span-12 lg:col-span-8 relative aspect-[16/10] border-2 border-[var(--rule)] bg-paper-deep overflow-hidden">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* Plate header strip */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b-2 border-[var(--rule)] bg-paper px-4 py-1.5">
            <span className="mono text-[10px] tracking-[0.18em] uppercase">
              Fig. 01 · Pinned thread
            </span>
            <span className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
              Scale 1∶1
            </span>
          </div>

          {/* Mock subject — design rectangles */}
          <div className="absolute left-[18%] right-[18%] top-[22%] flex flex-col gap-2">
            <div className="h-6 w-2/3" style={{ background: "var(--ink)" }} />
            <div className="h-2 w-full bg-[var(--rule)]/30" />
            <div className="h-2 w-5/6 bg-[var(--rule)]/30" />
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="aspect-square bg-[var(--accent)]/80" />
              <div className="aspect-square bg-[var(--ink)]/15" />
              <div className="aspect-square bg-[var(--highlight)]" />
            </div>
          </div>

          {/* The pin + measurement marks */}
          <SpecimenPin number="1" top="34%" left="36%" label="resolved" />
          <SpecimenPin number="2" top="62%" left="62%" label="open" emphasized />

          {/* Annotation pulled out of pin 2 */}
          <div
            className="absolute hidden border border-[var(--rule)] bg-paper p-3 lg:block"
            style={{
              top: "58%",
              left: "calc(62% + 56px)",
              width: 220,
            }}
          >
            <p className="mono text-[9px] tracking-[0.18em] uppercase ink-faint">
              Comment №2 · 14:02
            </p>
            <p className="mt-1 text-[13px] leading-[1.5] ink">
              Make this pop more. Bump the contrast so it stands out from the
              rest of the page.
            </p>
            <div className="hairline mt-2 pt-2 mono text-[10px] tracking-[0.16em] uppercase ink-soft flex items-center justify-between">
              <span>J. Doe</span>
              <span>Reply ↵</span>
            </div>
          </div>

          {/* Measurement axes */}
          <div className="absolute left-3 bottom-3 mono text-[9px] tracking-[0.18em] uppercase ink-faint">
            x: 36% · y: 34%
          </div>
        </div>

        {/* Specimen caption / breakdown */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="hairline-thick mb-3" />
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Caption
          </p>
          <p className="mt-3 text-[14px] leading-[1.6] ink-soft">
            A pin is a <em className="serif-italic">% coordinate</em> on the
            asset. Survives resize, zoom, and refit. Each pin owns a thread of
            messages, reactions, attachments, and an unambiguous status.
          </p>
          <ul className="mt-5 space-y-2.5 text-[13px] ink">
            <SpecRow label="Anchor" value="x %, y %" />
            <SpecRow label="Status" value="Open / Resolved" />
            <SpecRow label="Priority" value="None — Low — Med — High" />
            <SpecRow label="Reactions" value="👍 ❤️ 😂 👀 🚀 ⭐" />
            <SpecRow label="Attachments" value="PNG · PDF · ≤25 MB" />
            <SpecRow label="Mentions" value="@ workspace members" />
          </ul>
        </aside>
      </div>
    </section>
  );
}

function SpecimenPin({
  number,
  top,
  left,
  label,
  emphasized,
}: {
  number: string;
  top: string;
  left: string;
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className="absolute"
      style={{ top, left, transform: "translate(-50%, -50%)" }}
    >
      <div
        className="flex size-10 items-center justify-center rounded-full mono text-[14px] font-bold"
        style={{
          background: emphasized ? "var(--accent)" : "var(--ink)",
          color: "white",
          outline: "2px solid var(--paper)",
          outlineOffset: -2,
          boxShadow: emphasized
            ? "0 0 0 6px rgba(255,77,26,0.18)"
            : "0 0 0 4px rgba(22,21,19,0.12)",
        }}
      >
        {number}
      </div>
      <span
        className="mono absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[9px] tracking-[0.18em] uppercase"
        style={{ color: "var(--ink-soft)" }}
      >
        {label}
      </span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-dotted border-[var(--rule)]/40 pb-2">
      <span className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
        {label}
      </span>
      <span className="text-right">{value}</span>
    </li>
  );
}

/* ─────────────────────────  MANIFESTO  ───────────────────────── */

function Manifesto() {
  const lines = [
    "We believe a comment lives on the pixel.",
    "We believe meetings should be the second draft, not the first.",
    "We believe public links beat passwords.",
    "We believe approval is a status, not a feeling.",
    "We believe realtime is the only honest tense.",
  ];
  return (
    <section
      className="relative z-10 bg-ink py-20"
      style={{ color: "var(--paper)" }}
    >
      <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3">
            <p className="mono text-[10px] tracking-[0.18em] uppercase opacity-60">
              The masthead manifesto
            </p>
            <p
              className="serif-italic mt-3 text-[26px] leading-[1.1]"
              style={{ color: "var(--accent)" }}
            >
              &ldquo;Comments belong{" "}
              <span style={{ color: "var(--paper)" }}>where the work is.</span>
              &rdquo;
            </p>
          </div>
          <ol className="col-span-12 md:col-span-9 list-none space-y-1">
            {lines.map((l, i) => (
              <li
                key={i}
                className="flex items-baseline gap-5 border-b border-[var(--paper)]/20 py-3"
              >
                <span
                  className="mono shrink-0 text-[12px] tracking-[0.18em]"
                  style={{ color: "var(--accent)" }}
                >
                  {String(i + 1).padStart(2, "0")} ·
                </span>
                <span
                  className="display"
                  style={{ fontSize: "clamp(24px, 3.4vw, 44px)" }}
                >
                  {l}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  BENTO  ───────────────────────── */

function Bento() {
  return (
    <section className="relative z-10 mx-auto max-w-[1320px] px-6 py-20 lg:px-10">
      <div className="mb-10 flex items-end justify-between gap-6">
        <h3
          className="display"
          style={{ fontSize: "clamp(40px, 5vw, 80px)" }}
        >
          What ships in <span className="serif-italic accent">the box</span>
        </h3>
        <span className="mono hidden whitespace-nowrap text-[10px] tracking-[0.18em] uppercase ink-faint sm:inline">
          Plate II · Six features
        </span>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Big — Pin anything */}
        <BentoCard span="col-span-12 lg:col-span-7" tone="paper">
          <Kicker n="01" label="Pin anything" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(32px, 3vw, 52px)" }}
          >
            Drop a pin on PNG, PDF, DOCX, XLSX,{" "}
            <span className="serif-italic">a website</span>, or plain text.
          </h4>
          <div className="hairline mt-6 pt-4 grid grid-cols-3 gap-3 mono text-[10px] tracking-[0.18em] uppercase ink-soft">
            <span>· Image</span>
            <span>· PDF</span>
            <span>· Office</span>
            <span>· Website</span>
            <span>· Text</span>
            <span>· Markdown</span>
          </div>
        </BentoCard>

        {/* Tall — Realtime */}
        <BentoCard span="col-span-12 sm:col-span-6 lg:col-span-5" tone="ink">
          <Kicker n="02" label="Realtime" mode="ink" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(28px, 2.6vw, 44px)" }}
          >
            Threads + cursors stream live. The only acceptable tense.
          </h4>
          <div className="mt-6 flex items-center gap-2">
            <PulsingDot />
            <span className="mono text-[10px] tracking-[0.18em] uppercase opacity-70">
              4 viewers · 2 typing
            </span>
          </div>
        </BentoCard>

        {/* Approvals */}
        <BentoCard span="col-span-12 sm:col-span-6 lg:col-span-4" tone="paper">
          <Kicker n="03" label="Approvals" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(24px, 2.2vw, 36px)" }}
          >
            Draft → Review → <span className="accent">Approved</span>.
          </h4>
          <div className="mt-5 flex flex-col gap-1.5">
            {[
              { label: "Draft", state: "done" },
              { label: "Ready for review", state: "done" },
              { label: "Changes requested", state: "skip" },
              { label: "Approved", state: "current" },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between border-b border-dotted border-[var(--rule)]/40 pb-1.5"
              >
                <span
                  className={
                    "mono text-[10px] tracking-[0.18em] uppercase " +
                    (s.state === "current" ? "accent" : "ink-soft")
                  }
                >
                  {s.label}
                </span>
                <span className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                  {s.state === "done"
                    ? "✓"
                    : s.state === "current"
                      ? "●"
                      : "·"}
                </span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Guests */}
        <BentoCard span="col-span-12 sm:col-span-6 lg:col-span-4" tone="paper">
          <Kicker n="04" label="Guests, no login" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(24px, 2.2vw, 36px)" }}
          >
            Send a link.{" "}
            <span className="serif-italic ink-soft">They comment.</span>
          </h4>
          <p className="mt-4 mono text-[11px] tracking-[0.16em] ink-soft">
            beam.app/share/<span className="ink">7f3-c0n-91q</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {["JD", "AL", "MK", "+5"].map((n) => (
              <span
                key={n}
                className="mono inline-flex size-7 items-center justify-center rounded-full border border-[var(--rule)] bg-paper-deep text-[10px] font-bold"
              >
                {n}
              </span>
            ))}
          </div>
        </BentoCard>

        {/* Versions */}
        <BentoCard span="col-span-12 sm:col-span-6 lg:col-span-4" tone="highlight">
          <Kicker n="05" label="Versions" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(24px, 2.2vw, 36px)" }}
          >
            Compare v3 ↔ v4{" "}
            <span className="serif-italic">side-by-side.</span>
          </h4>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="aspect-square border border-[var(--rule)] bg-paper p-2 mono text-[10px] tracking-[0.18em] uppercase">
              v3
              <div className="mt-1 h-2 w-1/2 bg-[var(--ink)]/40" />
              <div className="mt-1 h-2 w-2/3 bg-[var(--ink)]/30" />
            </div>
            <div className="aspect-square border-2 border-[var(--ink)] bg-paper p-2 mono text-[10px] tracking-[0.18em] uppercase">
              v4 ●
              <div className="mt-1 h-2 w-3/4 bg-[var(--accent)]" />
              <div className="mt-1 h-2 w-1/2 bg-[var(--ink)]/30" />
            </div>
          </div>
        </BentoCard>

        {/* Audit */}
        <BentoCard span="col-span-12 lg:col-span-5" tone="paper">
          <Kicker n="06" label="Audit log" />
          <h4
            className="display mt-2"
            style={{ fontSize: "clamp(24px, 2.2vw, 36px)" }}
          >
            Every status change & approval, on the record.
          </h4>
          <ul className="hairline mt-5 pt-4 space-y-2 text-[12px]">
            {[
              ["09:14", "JD", "approved", "homepage-v4.png"],
              ["10:02", "MK", "resolved", "thread #12"],
              ["11:38", "AL", "uploaded", "v5"],
              ["13:21", "Guest", "commented on", "section-2.pdf"],
            ].map((row, i) => (
              <li
                key={i}
                className="grid grid-cols-[44px_24px_1fr_auto] items-baseline gap-2 border-b border-dotted border-[var(--rule)]/40 pb-2"
              >
                <span className="mono text-[10px] tracking-[0.16em] ink-faint">
                  {row[0]}
                </span>
                <span className="mono text-[10px] tracking-[0.16em] ink">
                  {row[1]}
                </span>
                <span className="ink-soft">{row[2]}</span>
                <span className="serif-italic ink">{row[3]}</span>
              </li>
            ))}
          </ul>
        </BentoCard>
      </div>
    </section>
  );
}

function BentoCard({
  span,
  tone,
  children,
}: {
  span: string;
  tone: "paper" | "ink" | "highlight";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "ink"
      ? "bg-ink"
      : tone === "highlight"
        ? "bg-highlight"
        : "bg-paper";
  return (
    <article
      className={`${span} relative ${toneClass} border-2 border-[var(--rule)] p-6 sm:p-8`}
    >
      {children}
    </article>
  );
}

function Kicker({
  n,
  label,
  mode,
}: {
  n: string;
  label: string;
  mode?: "ink";
}) {
  return (
    <div
      className={
        "flex items-baseline gap-2 mono text-[10px] tracking-[0.22em] uppercase " +
        (mode === "ink" ? "opacity-80" : "ink-soft")
      }
    >
      <span
        className={
          mode === "ink"
            ? "rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px]"
            : "rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-[9px]"
        }
        style={{ color: "white" }}
      >
        № {n}
      </span>
      <span>{label}</span>
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative inline-flex size-2.5">
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "var(--accent)",
          animation: "pulse-dot 1.4s ease-out infinite",
        }}
      />
      <span
        className="relative size-2.5 rounded-full"
        style={{ background: "var(--accent)" }}
      />
      <style>{`@keyframes pulse-dot { 0% {transform:scale(1); opacity:.6;} 100% {transform:scale(2.4); opacity:0;} }`}</style>
    </span>
  );
}

/* ─────────────────────────  CLOSING FOLD  ───────────────────────── */

function ClosingFold() {
  return (
    <section className="relative z-10 border-y-[3px] border-[var(--rule)]">
      <div className="mx-auto max-w-[1320px] px-6 py-24 lg:px-10">
        <div className="grid grid-cols-12 items-end gap-6">
          <p className="col-span-12 md:col-span-2 mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Sign off
          </p>
          <h3
            className="col-span-12 md:col-span-10 display"
            style={{ fontSize: "clamp(56px, 9vw, 144px)" }}
          >
            Drop a pin.{" "}
            <span className="serif-italic ink-soft">Move the work forward.</span>
          </h3>
        </div>
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="press inline-flex items-center bg-accent px-7 py-3 text-[14px] smallcaps"
            style={{ color: "white" }}
          >
            Begin a workspace →
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center px-5 py-3 text-[13px] smallcaps ink underline decoration-[var(--rule)] decoration-2 underline-offset-4 hover:decoration-[var(--accent)]"
          >
            See pricing
          </Link>
          <span className="mono ml-auto text-[10px] tracking-[0.18em] uppercase ink-faint">
            Free · personal · no card
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────  COLOPHON  ───────────────────────── */

function Colophon() {
  return (
    <footer className="relative z-10 bg-paper-deep">
      <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-6 px-6 py-12 lg:px-10">
        <div className="col-span-12 md:col-span-4">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Colophon
          </p>
          <p className="mt-3 text-[13px] leading-[1.6] ink-soft">
            Set in <span className="serif-italic">Fraunces</span>,{" "}
            <span className="serif-italic">Instrument Serif</span>, IBM Plex
            Sans, and JetBrains Mono. Printed on a warm-stone canvas. Made for
            teams that hate screenshot threads.
          </p>
        </div>
        <div className="col-span-6 md:col-span-2">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Product
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <FootLink href="/pricing" label="Pricing" />
            <FootLink href="/help" label="Help center" />
            <FootLink href="/login" label="Log in" />
            <FootLink href="/signup" label="Sign up" />
          </ul>
        </div>
        <div className="col-span-6 md:col-span-2">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            Legal
          </p>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            <FootLink href="#" label="Privacy" />
            <FootLink href="#" label="Terms" />
            <FootLink href="#" label="Security" />
          </ul>
        </div>
        <div className="col-span-12 md:col-span-4 md:text-right">
          <p
            className="display"
            style={{
              fontSize: "clamp(48px, 5vw, 88px)",
              fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 1",
            }}
          >
            Beam.
          </p>
          <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-faint">
            © {new Date().getFullYear()} · Vol. I · № {ISSUE}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FootLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="ink hover:accent underline decoration-[var(--rule)]/30 decoration-1 underline-offset-4 hover:decoration-[var(--accent)]"
      >
        {label}
      </Link>
    </li>
  );
}
