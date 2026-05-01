import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help center · Beam",
  description: "Catalog of every question you might ask. Pinned by topic.",
};

interface Entry {
  q: string;
  a: string;
  tags?: string[];
}
interface Section {
  call: string; // library call number e.g. "001.41"
  title: string;
  blurb: string;
  entries: Entry[];
}

const SECTIONS: Section[] = [
  {
    call: "001.41",
    title: "Getting started",
    blurb: "Before you drop your first pin.",
    entries: [
      {
        q: "What is Beam?",
        a: "A visual feedback tool for designers and product teams. Upload an image, PDF, or paste a website URL, drop pinned comments anywhere on it, share with reviewers. No login required for guests.",
        tags: ["overview"],
      },
      {
        q: "How do I create my first MarkUp?",
        a: "Dashboard → New MarkUp. Pick a tab — image, PDF, website. Drop or paste. You land on the canvas ready to comment.",
        tags: ["upload"],
      },
      {
        q: "What file formats are supported?",
        a: "Images (PNG, JPG, WEBP, GIF), PDFs (multi-page), websites (auto-screenshotted via Apify), Office docs (DOCX, XLSX, PPTX) via Microsoft Viewer, and plain text up to 1 MB.",
        tags: ["upload", "formats"],
      },
    ],
  },
  {
    call: "002.13",
    title: "Pinned comments",
    blurb: "The smallest unit of feedback.",
    entries: [
      {
        q: "How do I drop a pin?",
        a: "Click anywhere on the canvas. A composer opens — type, hit Enter, post. Pins anchor at percentage coordinates so they survive resize, fit-mode change, and zoom.",
        tags: ["pins"],
      },
      {
        q: "Can I drag pins?",
        a: "Yes. Hold and drag any pin to reposition. The thread snaps with a soft spring on drop.",
        tags: ["pins"],
      },
      {
        q: "How do reactions work?",
        a: "Hover a message and click the smile icon. Pick from 👍 ❤️ 😂 👀 🚀 ⭐. Counts update in realtime.",
        tags: ["reactions"],
      },
      {
        q: "Can I @-mention someone?",
        a: "Type @ in any composer to open a typeahead of workspace members. Mentioned users get an email + in-app notification regardless of their per-markup preference.",
        tags: ["mentions"],
      },
    ],
  },
  {
    call: "003.27",
    title: "Sharing & guests",
    blurb: "How outsiders join the review.",
    entries: [
      {
        q: "How do guests view a MarkUp?",
        a: "Click Share → copy link. Guests open it in any browser. They can comment if you enabled comments on the share link, no signup needed — just a name.",
      },
      {
        q: "Are share links secure?",
        a: "Each link uses a random 32-character token. Revoke any time from the share modal. Set view-only or comment-enabled per link.",
      },
      {
        q: "Can I expire share links?",
        a: "Not yet — coming soon. For now revoke manually when the project ships.",
      },
    ],
  },
  {
    call: "004.55",
    title: "Versions & approvals",
    blurb: "Stamping work as final.",
    entries: [
      {
        q: "How do I upload a new version?",
        a: "Canvas → Versions → New version. Drop a file. The new version becomes current; old versions stay viewable in history.",
      },
      {
        q: "What does Approve do?",
        a: "Marks the current version as locked-final. Status flips to Approved, an audit row is written, reviewers get notified. You can still comment, but the badge tells everyone the work is signed off.",
      },
      {
        q: "Can I compare versions?",
        a: "Yes. Versions → Compare on any older one. Side-by-side view of that version vs current.",
      },
    ],
  },
  {
    call: "005.09",
    title: "Workspaces & people",
    blurb: "Owning the room.",
    entries: [
      {
        q: "How do I create another workspace?",
        a: "Click your workspace name in the sidebar to open the switcher → New workspace. Each workspace has its own MarkUps, members, and plan.",
      },
      {
        q: "How do I invite teammates?",
        a: "People → Invite. Enter emails, pick a role. They get an email invite from Beam. Pending invites show in the People list until accepted.",
      },
      {
        q: "What roles exist?",
        a: "Owner can do anything including delete the workspace. Member can create and edit MarkUps. Guest is reserved for share-link viewers.",
      },
    ],
  },
  {
    call: "006.00",
    title: "Keyboard shortcuts",
    blurb: "Hands on home row.",
    entries: [
      {
        q: "Global",
        a: "⌘K — open command palette · / — focus search · ? — show shortcuts dialog inside the canvas.",
      },
      {
        q: "Canvas",
        a: "Cmd/Ctrl + scroll — zoom · Space + drag — pan · 1 — fit width · 2 — fit height · 3 — actual size · [ — previous markup · ] — next markup.",
      },
      {
        q: "Status",
        a: "a — approve · r — needs revisions · y — ready for review · d — draft · c — toggle comments · b — toggle bulk select on dashboard.",
      },
    ],
  },
  {
    call: "007.92",
    title: "Troubleshooting",
    blurb: "When the work refuses to play.",
    entries: [
      {
        q: "My PDF won't render",
        a: "Refresh. If it still fails, the PDF may be password-protected — Beam doesn't support encrypted PDFs yet. Re-export without a password and try again.",
      },
      {
        q: "Comments aren't showing up live",
        a: "Realtime requires WebSockets. Some corporate networks block them. Reload the page and they'll appear — your data is never lost.",
      },
      {
        q: "Upload failed at 100%",
        a: "Files over 50 MB are rejected at the API level. Compress the PDF or downsize the image and retry.",
      },
    ],
  },
  {
    call: "008.40",
    title: "Privacy & security",
    blurb: "Your work, your data.",
    entries: [
      {
        q: "Where is my data stored?",
        a: "All MarkUps, comments, and uploads live in our Supabase Postgres + Storage in EU. We never train models on your content.",
      },
      {
        q: "Can I delete a MarkUp?",
        a: "Yes. Three-dot menu → Delete. Moves to Trash for 30 days, then purged. Restore from Settings → Danger zone → Open trash within that window.",
      },
      {
        q: "How do I delete my account?",
        a: "Email support@beam.app — full deletion within 7 business days, including every comment you posted.",
      },
    ],
  },
];

export default function HelpPage() {
  // Build alphabetical "card catalog" index from all questions.
  const allQuestions = SECTIONS.flatMap((s) =>
    s.entries.map((e) => ({ ...e, section: s.title, call: s.call })),
  );
  const indexLetters = Array.from(
    new Set(allQuestions.map((e) => e.q[0]?.toUpperCase()).filter(Boolean)),
  ).sort();

  return (
    <div className="editorial relative min-h-screen overflow-hidden">
      <div className="grain absolute inset-0" />

      {/* Catalog header */}
      <header className="relative z-10 border-b-[3px] border-[var(--rule)]">
        <div className="mx-auto flex max-w-[1200px] items-end justify-between gap-6 px-6 pt-5 pb-3 lg:px-8">
          <Link
            href="/"
            className="mono text-[10px] tracking-[0.18em] uppercase ink-soft hover:ink"
          >
            ← Beam · Index
          </Link>
          <div className="mono flex items-center gap-3 text-[10px] tracking-[0.18em] uppercase ink-faint">
            <span>Card-catalog</span>
            <span>·</span>
            <span>Reading room</span>
          </div>
        </div>
        <div className="mx-auto max-w-[1200px] px-6 pb-3 lg:px-8">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 md:col-span-3">
              <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                Reference shelf
              </p>
              <p className="mono mt-2 text-[10px] tracking-[0.18em] uppercase ink-soft">
                {SECTIONS.length} sections · {allQuestions.length} entries
              </p>
            </div>
            <h1
              className="col-span-12 md:col-span-9 display"
              style={{
                fontSize: "clamp(56px, 9vw, 144px)",
                fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'WONK' 1",
              }}
            >
              The <span className="serif-italic accent">Beam</span> reference
              library
            </h1>
          </div>
        </div>
      </header>

      {/* Alphabetical index strip */}
      <nav
        aria-label="Index"
        className="relative z-10 border-b border-[var(--rule)] bg-paper-deep"
      >
        <div className="mx-auto flex max-w-[1200px] items-center gap-1 overflow-x-auto px-6 py-2 lg:px-8">
          <span className="mono shrink-0 mr-2 text-[10px] tracking-[0.18em] uppercase ink-faint">
            Browse →
          </span>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => {
            const has = indexLetters.includes(l);
            return (
              <a
                key={l}
                href={has ? `#letter-${l}` : undefined}
                className={
                  "mono shrink-0 px-2 py-1 text-[11px] " +
                  (has
                    ? "ink hover:bg-ink hover:text-[var(--paper)]"
                    : "ink-faint pointer-events-none")
                }
              >
                {l}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Reading room: TOC + entries side by side */}
      <main className="relative z-10 mx-auto max-w-[1200px] px-6 py-14 lg:px-8">
        <div className="grid grid-cols-12 gap-10">
          {/* Sidebar TOC */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-6">
              <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                Contents
              </p>
              <ol className="mt-4 space-y-2.5">
                {SECTIONS.map((s) => (
                  <li
                    key={s.call}
                    className="grid grid-cols-[64px_1fr] gap-2 border-b border-dotted border-[var(--rule)]/40 pb-2"
                  >
                    <span className="mono text-[11px] ink-faint">{s.call}</span>
                    <a
                      href={`#sec-${s.call}`}
                      className="serif-italic text-[15px] ink hover:accent"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-10 border-2 border-[var(--rule)] p-4">
                <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                  Librarian on duty
                </p>
                <p className="mt-3 text-[14px] leading-[1.5]">
                  Can&rsquo;t find an answer?{" "}
                  <a
                    href="mailto:support@beam.app"
                    className="serif-italic accent underline decoration-[var(--accent)]/40 underline-offset-4 hover:decoration-[var(--accent)]"
                  >
                    Email support@beam.app
                  </a>{" "}
                  and we&rsquo;ll reply within a business day.
                </p>
              </div>
            </div>
          </aside>

          {/* Main column */}
          <article className="col-span-12 lg:col-span-9 stagger">
            {SECTIONS.map((section) => (
              <section
                key={section.call}
                id={`sec-${section.call}`}
                className="mb-16 first:mt-0 scroll-mt-32"
              >
                <header className="mb-8 grid grid-cols-12 items-end gap-4 border-b-[3px] border-[var(--rule)] pb-4">
                  <span className="col-span-12 md:col-span-2 mono text-[12px] tracking-[0.16em] ink-faint">
                    {section.call}
                  </span>
                  <h2
                    className="col-span-12 md:col-span-7 display"
                    style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
                  >
                    {section.title}
                  </h2>
                  <p className="col-span-12 md:col-span-3 serif-italic text-[14px] ink-soft md:text-right">
                    {section.blurb}
                  </p>
                </header>

                <ol className="space-y-7">
                  {section.entries.map((e, i) => {
                    const letter = e.q[0]?.toUpperCase() ?? "";
                    return (
                      <li
                        key={e.q}
                        id={i === 0 ? `letter-${letter}` : undefined}
                        className="grid grid-cols-[44px_1fr] gap-5"
                      >
                        {/* Q-letter card */}
                        <div className="relative">
                          <div className="sticky top-6 flex flex-col items-center">
                            <span
                              className="display"
                              style={{
                                fontSize: 56,
                                lineHeight: 0.8,
                                fontVariationSettings:
                                  "'opsz' 144, 'SOFT' 0, 'WONK' 1",
                                color: "var(--accent)",
                              }}
                            >
                              {letter}
                            </span>
                            <span className="mono mt-1 text-[10px] tracking-[0.16em] ink-faint">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3
                            className="display"
                            style={{ fontSize: "clamp(20px, 1.8vw, 26px)" }}
                          >
                            {e.q}
                          </h3>
                          <p className="mt-2 text-[15px] leading-[1.65] ink-soft">
                            {e.a}
                          </p>
                          {e.tags ? (
                            <ul className="mt-3 flex flex-wrap gap-1.5">
                              {e.tags.map((t) => (
                                <li
                                  key={t}
                                  className="mono inline-flex items-center border border-[var(--rule)] px-1.5 py-0.5 text-[10px] tracking-[0.16em] uppercase ink-soft"
                                >
                                  ⊕ {t}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}

            {/* Closing card-catalog drawer */}
            <div className="mt-20 border-2 border-[var(--rule)] bg-paper-deep p-8">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-7">
                  <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
                    Still on the shelf?
                  </p>
                  <h2
                    className="display mt-2"
                    style={{ fontSize: "clamp(30px, 3vw, 48px)" }}
                  >
                    Open a ticket. We read every one.
                  </h2>
                  <p className="mt-3 text-[14px] ink-soft">
                    No bots, no chatbots, no escalation tiers.{" "}
                    <em className="serif-italic">
                      Two engineers and a designer
                    </em>{" "}
                    sit on this inbox.
                  </p>
                </div>
                <div className="col-span-12 md:col-span-5 flex md:items-end md:justify-end">
                  <a
                    href="mailto:support@beam.app"
                    className="press inline-flex items-center bg-accent px-6 py-3 text-[13px] smallcaps"
                    style={{ color: "white" }}
                  >
                    support@beam.app →
                  </a>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>

      {/* Footer slip */}
      <footer className="relative z-10 border-t border-[var(--rule)] py-8">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 lg:px-8 sm:flex-row">
          <p className="mono text-[10px] tracking-[0.18em] uppercase ink-faint">
            © {new Date().getFullYear()} Beam · Reference library
          </p>
          <div className="mono flex items-center gap-4 text-[10px] tracking-[0.18em] uppercase">
            <Link href="/" className="ink-soft hover:ink">
              Home
            </Link>
            <Link href="/pricing" className="ink-soft hover:ink">
              Pricing
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
