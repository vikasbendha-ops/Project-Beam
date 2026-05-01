import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Keyboard,
  LifeBuoy,
  MessageSquare,
  Mouse,
  Pin,
  Share2,
  Shield,
  Upload,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help center · Beam",
  description: "Everything you need to get unstuck in Beam.",
};

const SECTIONS: Array<{
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  items: { q: string; a: string }[];
}> = [
  {
    title: "Getting started",
    icon: BookOpen,
    items: [
      {
        q: "What is Beam?",
        a: "Beam is a visual feedback tool for designers and product teams. Upload an image, PDF, or paste a website URL, drop pinned comments anywhere on it, and share with reviewers — no logins needed for guests.",
      },
      {
        q: "How do I create my first MarkUp?",
        a: "From your dashboard, click New MarkUp. Pick a tab — image, PDF, or website — drop or paste, and you land directly on the canvas ready to comment.",
      },
      {
        q: "What file formats are supported?",
        a: "Images (PNG, JPG, WEBP, GIF), PDFs (multi-page), websites (we screenshot via Apify), Office docs (DOCX, XLSX, PPTX) via Microsoft Viewer, and plain text up to 1 MB.",
      },
    ],
  },
  {
    title: "Pinned comments",
    icon: Pin,
    items: [
      {
        q: "How do I drop a pin?",
        a: "Click anywhere on the canvas. A composer pops up — type, hit Enter or click Post. Pins are anchored to the exact pixel as a percentage of the image, so they survive resize, fit-mode change, and zoom.",
      },
      {
        q: "Can I drag pins?",
        a: "Yes — hold and drag any pin to reposition. The thread snaps with a soft spring on drop.",
      },
      {
        q: "How do reactions work?",
        a: "Hover a message and click the smile icon. Pick from 👍 ❤️ 😂 👀 🚀 ⭐. Counts update in realtime for everyone viewing the markup.",
      },
      {
        q: "Can I @-mention someone?",
        a: "Type @ in any composer to open a typeahead of workspace members. Mentioned users get an email + in-app notification regardless of their per-markup preference.",
      },
    ],
  },
  {
    title: "Sharing & guests",
    icon: Share2,
    items: [
      {
        q: "How do guests view a MarkUp?",
        a: "Click Share → copy link. Guests open it in any browser. They can comment if you enabled comments on the share link, no signup needed — just a name (email optional).",
      },
      {
        q: "Are share links secure?",
        a: "Each link uses a random 32-character token. Revoke any time from the share modal. Links can be view-only or comment-enabled, set per-link.",
      },
      {
        q: "Can I expire share links?",
        a: "Not yet — coming soon. For now revoke manually when the project ships.",
      },
    ],
  },
  {
    title: "Versions & approvals",
    icon: Upload,
    items: [
      {
        q: "How do I upload a new version?",
        a: "From the canvas top-bar click Versions → New version. Drop a file. The new version becomes current, but every old version stays viewable in history.",
      },
      {
        q: "What does Approve do?",
        a: "Approve marks the current version as locked-final. Status flips to Approved, an audit row is written, and reviewers get notified. You can still comment, but the badge tells everyone the work is signed off.",
      },
      {
        q: "Can I compare versions?",
        a: "Yes — open Versions, click Compare on any older one. Side-by-side view of that version vs current.",
      },
    ],
  },
  {
    title: "Workspaces & people",
    icon: Users,
    items: [
      {
        q: "How do I create another workspace?",
        a: "Click your workspace name in the sidebar to open the switcher, then New workspace. Each workspace has its own MarkUps, members, and plan.",
      },
      {
        q: "How do I invite teammates?",
        a: "Open People → Invite. Enter emails, pick a role. They get an email invite from Beam. Pending invites show in the People list until accepted.",
      },
      {
        q: "What roles exist?",
        a: "Owner can do anything including delete the workspace. Member can create and edit MarkUps. Guest is reserved for share-link viewers.",
      },
    ],
  },
  {
    title: "Keyboard shortcuts",
    icon: Keyboard,
    items: [
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
    title: "Troubleshooting",
    icon: LifeBuoy,
    items: [
      {
        q: "My PDF won't render",
        a: "Refresh the canvas page. If it still fails, the PDF may be password-protected — Beam doesn't support encrypted PDFs yet. Re-export without a password and try again.",
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
    title: "Privacy & security",
    icon: Shield,
    items: [
      {
        q: "Where is my data stored?",
        a: "All MarkUps, comments, and uploads live in our Supabase Postgres + Storage in EU. We never train models on your content.",
      },
      {
        q: "Can I delete a MarkUp?",
        a: "Yes — three-dot menu → Delete. It moves to Trash for 30 days, then is purged. Restore from Settings → Danger zone → Open trash within that window.",
      },
      {
        q: "How do I delete my account?",
        a: "Email support@beam.app — full deletion within 7 business days, including every comment you posted.",
      },
    ],
  },
];

const QUICK_LINKS: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}> = [
  { href: "/signup", label: "Create an account", icon: Users },
  { href: "/pricing", label: "See pricing", icon: BookOpen },
  { href: "mailto:support@beam.app", label: "Email support", icon: MessageSquare },
  { href: "/", label: "Watch product tour", icon: Mouse },
];

export default function HelpPage() {
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
              href="/pricing"
              className="rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Pricing
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

      <section className="border-b border-border/60 bg-muted/30 px-6 py-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <LifeBuoy className="size-3 text-primary" />
          Help center
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Browse the most common questions, or email{" "}
          <a
            href="mailto:support@beam.app"
            className="font-semibold text-primary hover:underline"
          >
            support@beam.app
          </a>{" "}
          and we&rsquo;ll reply within a business day.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.label}
              href={q.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <q.icon className="size-4" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-semibold text-foreground">
                {q.label}
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {SECTIONS.map((section) => (
            <article
              key={section.title}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card"
            >
              <header className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <section.icon className="size-4" strokeWidth={1.75} />
                </span>
                <h2 className="text-base font-semibold text-foreground">
                  {section.title}
                </h2>
              </header>
              <dl className="flex flex-col gap-3">
                {section.items.map((it) => (
                  <div
                    key={it.q}
                    className="rounded-lg border border-border bg-background p-3.5"
                  >
                    <dt className="text-sm font-semibold text-foreground">
                      {it.q}
                    </dt>
                    <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {it.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Beam. Made for teams that ship.</p>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
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
