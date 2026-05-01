# BEAM — Project Brief for Claude Code

> **Read this entire file before writing any code.** Then read `TECH_STACK.md` and `DATABASE_SCHEMA.sql`. Designs from connected Stitch MCP server — fetch as build each screen.

---

## 1. What you're building

**Beam** = internal visual-feedback web app inspired by markup.io. Users upload images + PDFs (optionally websites), drop pin-style comments anchored to exact positions on asset. Built for agencies + internal teams to collect contextual feedback faster than email.

**Core flow:** Sign up → personal workspace auto-created → upload image/PDF → drop pins → share link → reviewers comment → approve.

---

## 2. Hard rules (do not violate)

1. **NO HARDCODED MOCK DATA anywhere.** All user-visible data from Supabase. Stitch designs show sample data — must exist as **real seed rows in DB**, inserted via seed script in `DATABASE_SCHEMA.sql`. Frontend fetch dynamically.
2. **NO secrets in code.** All API keys, tokens, URLs go in `.env.local` (referenced by `process.env.X`). Never commit `.env.local`. Only commit `.env.example` with placeholder values.
3. **TypeScript strict mode** whole project. No `any` unless unavoidable.
4. **Mobile-first, fully responsive.** Every screen pixel-perfect at 390×844 (iPhone), 768×1024 (tablet), 1440×900+ (desktop). Touch targets ≥ 44×44px.
5. **No video features.** No MP4, no scrubbers, no frame-step. Image + PDF only (+ optional website via Apify).
6. **No native integrations** v1 — no Slack, Teams, Zapier, Chrome extension. Email-only notifications via Resend.
7. **No comment export** (no CSV/JSON download).
8. **Email + password auth only.** No OAuth, magic links, SSO.
9. **Light theme only.** No dark mode.
10. **Use Stitch MCP** to fetch designs per screen as you build. Do NOT improvise UI from imagination — Stitch designs = source of truth for layout, spacing, components.

---

## 3. Tech stack (use latest stable versions)

- **Runtime:** Node.js 22 LTS (or latest LTS)
- **Framework:** Next.js 15 (App Router, Server Components default)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **UI primitives:** shadcn/ui (latest, install components as needed)
- **Database + Auth + Storage + Realtime:** Supabase
- **Supabase client:** `@supabase/supabase-js` v2 + `@supabase/ssr` for Next.js cookies
- **State management:** Zustand (canvas viewer state — pins, zoom, active thread)
- **Forms:** React Hook Form + Zod
- **PDF rendering:** `pdfjs-dist` (Mozilla PDF.js) — render pages as canvas
- **Icons:** Lucide React (matches Stitch icon style — 1.5px stroke, rounded)
- **Fonts:** Plus Jakarta Sans via `next/font/google`
- **Email:** Resend (`resend` SDK)
- **Website screenshots (optional v1):** Apify (`apify-client` SDK) — see Section 9
- **Deployment:** Vercel (user connects themselves; just push code to GitHub)
- **Repository:** https://github.com/vikasbendha-ops/Project-Beam.git

---

## 4. Project name + branding

- **Name:** Beam
- **Wordmark:** "Beam" in Plus Jakarta Sans 700 weight
- **Logo concept:** simple beam-of-light icon or stylized indigo dot (Stitch designs = source of truth)
- **Tagline:** "Faster feedback on websites, images, and PDFs."
- **Primary color:** Indigo `#4F46E5`
- **Email sender:** `Beam <hello@yourdomain.com>` (user configures Resend domain)

---

## 5. Object model (matches DATABASE_SCHEMA.sql)

```
User (auth.users)
  └─ Profile (1:1)
  └─ Workspaces owned (1:many)
       └─ Workspace Members (many:many)
       └─ Folders (1:many, nested up to 5 deep)
            └─ MarkUps (1:many)
                 └─ MarkUp Versions (1:many)
                 └─ Threads (1:many) — the pins
                      └─ Messages (1:many) — replies
                 └─ Share Links (1:many)
```

**Key concepts:**
- Every user gets ONE personal workspace auto-created on signup, named "{First Name}'s Workspace".
- Users can share workspace with others (becomes "Shared with me" for those users).
- Roles: `owner`, `member`, `guest`.
- Guests reviewing via share link no account needed — enter Name (required) + Email (optional) on first comment.

---

## 6. Status workflow (auto-managed by triggers)

| Status | Trigger |
|---|---|
| `draft` | New MarkUp created, not yet shared |
| `ready_for_review` | Owner clicks Share OR adds first comment |
| `changes_requested` | Non-owner user/guest adds comment |
| `approved` | Anyone with access clicks Approve button (manual) |

DB triggers handle transitions automatically. See `DATABASE_SCHEMA.sql`.

---

## 7. Screen list (16 screens — use Stitch MCP for each)

For each screen, fetch design from Stitch MCP, implement pixel-perfect for desktop + mobile.

1. Marketing landing page (`/`)
2. Sign up (`/signup`)
3. Log in (`/login`)
4. Forgot password (`/forgot-password`)
5. Onboarding / welcome (`/welcome`)
6. Dashboard / workspace home (`/w/[workspaceId]`)
7. Folder view (`/w/[workspaceId]/folder/[folderId]`)
8. New MarkUp creation modal (component, opens over dashboard)
9. **Canvas viewer** (`/w/[workspaceId]/markup/[markupId]`) — HERO SCREEN, invest most fidelity
10. Share modal (component)
11. Version history (`/w/[workspaceId]/markup/[markupId]/versions`)
12. Team / People (`/w/[workspaceId]/people`)
13. Settings (`/w/[workspaceId]/settings`)
14. Notifications center (`/w/[workspaceId]/notifications`)
15. Public guest share view (`/share/[token]`)
16. Workspace switcher (component)

---

## 8. Recommended build order

Build vertical slices. Don't scaffold everything then add features.

**Phase 1 — Foundation (Day 1)**
1. Init Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui
2. Set up Supabase client (server + browser variants via `@supabase/ssr`)
3. Run `DATABASE_SCHEMA.sql` in Supabase Dashboard (user does this, OR run via Supabase Management API)
4. Configure Resend SDK
5. Set up Plus Jakarta Sans via `next/font/google`
6. Set up Tailwind theme tokens to match design system (colors, radii, shadows from `TECH_STACK.md`)
7. Push to GitHub repo

**Phase 2 — Auth (Day 1-2)**
8. Signup page (Supabase Auth email + password) — fetch design from Stitch MCP
9. Login page
10. Forgot password page (Supabase reset flow + Resend)
11. Email confirmation handling
12. On signup, trigger creates personal workspace + profile (already in schema)
13. Middleware for protected routes

**Phase 3 — Workspace & Dashboard (Day 2-3)**
14. Onboarding screen (post-signup)
15. Dashboard with empty state (use Stitch design)
16. Workspace switcher component
17. Folder navigation
18. Sidebar component (collapsible)
19. Mobile drawer for sidebar

**Phase 4 — Upload & MarkUps (Day 3-4)**
20. New MarkUp modal (image + PDF tabs; defer URL/website tab to Phase 8)
21. Supabase Storage upload with progress, 50MB validation
22. MarkUp grid cards with status pills
23. Three-dot menu (rename, move, archive, delete)
24. Folder operations (create, rename, delete)

**Phase 5 — Canvas viewer (Day 4-6) — THE HERO**
25. Image canvas (drag-pan, scroll-zoom)
26. PDF canvas (multi-page scroll via pdfjs-dist)
27. Pin placement on click (store as % coordinates)
28. Comment popover anchored to pin
29. Comment panel sidebar (desktop) / bottom sheet (mobile)
30. Realtime subscription for live thread/message updates
31. Resolve / unresolve threads
32. @mention autocomplete (typeahead from workspace members)
33. File attachments in messages (50MB cap)
34. Approve button + status transitions

**Phase 6 — Sharing (Day 6-7)**
35. Share modal with email invites + share link generation
36. Public guest view at `/share/[token]`
37. Guest comment flow (Name required, Email optional, cached in localStorage)
38. Email invite delivery via Resend

**Phase 7 — Versioning + Notifications (Day 7-8)**
39. Version history view (desktop list + mobile cards)
40. Upload new version flow
41. Notifications center
42. Email notification triggers via Resend (mention, reply, status change, share)
43. Per-MarkUp notification preferences

**Phase 8 — Polish + optional website type (Day 8-9)**
44. Settings page (profile, workspace, notifications, danger zone)
45. Team / People management
46. Mobile pull-to-refresh, swipe gestures on notifications
47. Loading skeletons across all screens
48. Toast notifications
49. **Optional:** Apify integration for website screenshots (see Section 9)

---

## 9. Website type (optional v1 via Apify)

True iframe-proxy like markup.io = hard (CORS, headers, etc.). For v1 use **screenshot-as-image approach**:

1. User pastes URL in "New MarkUp" → URL tab
2. Backend calls Apify actor (e.g., `apify/website-screenshot-crawler` or similar full-page screenshot actor)
3. Apify returns full-page PNG
4. Save PNG to Supabase Storage
5. Create MarkUp with `type = 'website'`, store original URL in `source_url` column, treat PNG as canvas
6. Pins placed on screenshot at (x%, y%) coordinates

**Trade-off accepted:** Site not live/interactive — static snapshot. Good enough v1. Skip entire feature if Apify integration takes more than half day. Image + PDF = priority.

Apify SDK: `npm install apify-client`. Token from env: `APIFY_API_TOKEN`.

---

## 10. Critical UX details (from Stitch + product behavior)

- **Pins:** 28px circle desktop / 32px mobile. Coral indigo `#4F46E5` fill, white digit, soft shadow. On drop: scale animation 0 → 1.15 → 1 over 250ms.
- **Mobile canvas:** comment panel = bottom sheet drawer with peek/half/full states (use `vaul` library or build with framer-motion).
- **Mobile FAB:** floating "+" button bottom-right for "drop a pin" mode.
- **Realtime:** subscribe to `threads` and `messages` tables filtered by markup_id. Optimistic UI updates.
- **Status pills:** dot + label. Always visible on dashboard cards + canvas top bar.
- **Empty states:** illustration + headline + sub-copy + CTA. Consistent across screens.
- **Loading:** skeleton placeholders animated with shimmer. Never spinners except inside buttons during submit.
- **Toasts:** bottom-right desktop, bottom-center mobile, 4s auto-dismiss.

---

## 11. Stitch MCP usage

Stitch MCP server configured at `https://stitch.googleapis.com/mcp`. Use to fetch design per screen before implementing. Stitch project name = "Beam" (or whatever user named it).

**For each screen:**
1. Query Stitch MCP for screen design (desktop + mobile)
2. Inspect layout, components, spacing
3. Match design pixel-perfect using Tailwind classes
4. Use shadcn/ui components where they fit (Button, Input, Dialog, DropdownMenu, etc.)
5. Build custom components for product-specific UI (Pin, CommentCard, AnnotationToolbar, etc.)

**Do not improvise** — if design detail ambiguous, ask user, don't guess.

---

## 12. Repository setup

- **Repo:** https://github.com/vikasbendha-ops/Project-Beam.git
- Init git in project root
- Create clear `.gitignore` (Next.js defaults + `.env.local`, `.vercel`, `node_modules`, `.next`)
- Commit early + often with descriptive messages
- Branch strategy: work on `main` for v1, no feature branches needed
- First commit: "Initial Beam scaffolding"

---

## 13. What to ask the user when stuck

- **Designs:** if Stitch MCP missing screen, ask — don't invent.
- **Supabase migration:** confirm whether to run via Management API with access token, OR provide SQL for them to paste in Supabase Dashboard SQL Editor (recommended — simpler).
- **Resend:** ask for verified sender domain/email before implementing first email send. If not ready, stub email function with console.log.
- **Apify:** confirm whether to attempt website type in v1 or skip.
- **Domain:** for now, all `<a>` links go to `process.env.NEXT_PUBLIC_APP_URL` (set to `http://localhost:3000` for dev, becomes Vercel URL later).

---

## 14. Quality bar

- Run `tsc --noEmit` after every major change. Zero TypeScript errors.
- Run `next build` before committing major features. Zero build errors.
- Use `eslint` with Next.js defaults.
- All forms validated with Zod schemas.
- All async operations have proper loading + error states.
- All buttons that perform actions show loading state during submit.
- All destructive actions (delete workspace, delete MarkUp) require confirmation dialogs.
- All Supabase queries use proper typing (generated types from Supabase CLI).

---

## 15. What "done" looks like for v1

- User can sign up, get personal workspace, log in
- Upload image or PDF, drop pins, write comments
- Share link with reviewers (no signup required for them)
- Reviewers comment as guests with name + optional email
- Status auto-flows Draft → Ready for Review → Changes Requested → Approved
- All screens responsive desktop/tablet/mobile
- Email notifications work via Resend
- Real-time comment updates work
- Code in GitHub repo, ready for user to connect Vercel
- Zero hardcoded data — everything from Supabase
- Zero secrets in code

---

## 16. Files Claude Code should reference throughout

- `PROJECT_BRIEF.md` (this file) — master spec
- `TECH_STACK.md` — exact dependencies, env vars, file structure
- `DATABASE_SCHEMA.sql` — complete schema; user runs in Supabase Dashboard
- Stitch MCP — fetch designs per screen

Start Phase 1. Confirm Supabase schema in place before building anything that touches DB.

Good luck. Build fast + clean. ⚡