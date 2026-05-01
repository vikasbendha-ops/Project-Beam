# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project — Beam

Internal visual-feedback web app inspired by markup.io. Users upload images / PDFs (or paste URLs that get screenshotted via Apify), drop pin-style comments anchored to exact positions, share with reviewers, and approve.

Source-of-truth specs live alongside code:

- `PROJECT_BRIEF.md` — product brief, hard rules (light theme only, no mock data, email + password auth only), screen list, 8-phase build order
- `TECH_STACK.md` — exact dependencies, env vars, file structure, Supabase client patterns
- `DATABASE_SCHEMA.sql` — complete Postgres schema (already deployed to Supabase via Management API)
- `START_HERE.md` — bootstrap checklist

## Critical: This is **not** the Next.js you know

We're on **Next.js 16 + Turbopack + React 19**. APIs, conventions, and file structure differ from older training data. Read `node_modules/next/dist/docs/` before touching framework internals. Heed deprecation notices.

## Commands

```bash
pnpm dev                # Next dev server (Turbopack)
pnpm build              # Production build (Turbopack, includes typecheck)
pnpm exec tsc --noEmit  # Standalone TS check (faster than full build)
pnpm lint               # ESLint with eslint-config-next

./scripts/generate-types.sh   # Regenerate src/types/database.ts from live Supabase
                              # Reads SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF from .env.local
```

There are no test scripts — the project ships without a Jest/Vitest setup. Verify changes with `pnpm exec tsc --noEmit && pnpm build`.

## Architecture

### Route groups + auth gating

```
src/app/
  page.tsx                       Marketing landing (public)
  (auth)/                        login, signup, forgot-password, reset-password
  (app)/                         Authenticated app
    welcome/                     Onboarding (post-signup landing)
    w/[workspaceId]/             Workspace shell — Sidebar + TopNav + FoldersProvider
      page.tsx                   Dashboard (root markups)
      folder/[folderId]/         Folder view
      markup/[markupId]/         Canvas viewer (HERO) + loading.tsx skeleton
      markup/[markupId]/versions Version history
      people, settings, notifications
  invites/[token]/               Invite accept landing (auth-gated CTA inside)
  share/[token]/                 Public guest view — no auth needed
  api/                           Route handlers (see API surface)
  auth/callback, auth/confirm    Supabase OAuth/PKCE handlers
```

`middleware.ts` (root) wraps every request through `src/lib/supabase/middleware.ts:updateSession` — refreshes the Supabase session cookie and 302s unauthenticated traffic away from `/w/*` and `/welcome`.

### Supabase clients — four variants, pick the right one

`src/lib/supabase/`:

- `client.ts` — `createBrowserClient` for client components.
- `server.ts` — `createServerClient` (cookies via `next/headers`) for Server Components + Route Handlers.
- `service.ts` — service-role client. **Only use** for: public guest endpoints (`/api/share/[token]/*`), backend notification dispatch, Apify webhook persist, and the email-probe endpoint. Never reach for it just to bypass RLS.
- `middleware.ts` — session-refresh helper used by the root middleware.

Generated types live in `src/types/database.ts`. Re-run `scripts/generate-types.sh` after schema changes.

### Canvas viewer (the HERO screen)

`src/components/canvas/` — most complex subsystem. Key file: `canvas-state.tsx`.

- **`CanvasStateProvider`** holds threads in a `useReducer` store. Mutators (`createThread`, `postReply`, `setThreadStatus`, `deleteThread`, `deleteMessage`) are **optimistic**: they patch local state immediately, fire the API in the background, replace temp IDs on success, and roll back on error. There is no `router.refresh()` after self-actions.
- The provider's `useEffect` subscribes to Supabase Realtime (`postgres_changes` on `threads` + `messages`). Inbound payloads merge into the same store — other users' edits land without a server round-trip.
- **`ImageCanvas`** owns pan/zoom (Cmd/Ctrl+wheel cursor-centred zoom, hold-Space-drag or middle-mouse pan, three fit modes: fit-width / fit-height / actual×zoom). It uses a plain `<img>` (not `next/image`) so we control sizing for arbitrary zoom levels.
- **Pin coordinates are percentages** of the image's intrinsic dimensions, stored as `threads.x_position` / `y_position`. They survive resize, fit-mode changes, and zoom.
- **`renderOverlay` slot** — `ImageCanvas` exposes one render-prop that mounts inside the image stage. Both `PendingPinComposer` (new pin) and `ThreadPopover` (active thread) go through it so their `left/top` percentages share the same coordinate space as pins. **Anything anchored to a pin position must render through this slot, not as a sibling of `ImageCanvas`.**
- `loading.tsx` next to the canvas page renders a full layout skeleton during navigation, plus the page emits `<link rel="preload" as="image">` for prev/next siblings and `SiblingPreloader` does `router.prefetch()` + `new Image()` warm-up on mount.

### Notification dispatch

`src/lib/notifications/dispatch.ts:dispatchNotifications` is called from every mutating thread/message/approve route. It:

1. Resolves workspace members minus the actor.
2. Loads global preferences (`notification_preferences`) + per-markup overrides (`markup_notification_settings`).
3. Filters: `off` users only get notified if explicitly `@`-mentioned; `mentions` same; `all` gets everything.
4. Batch-inserts `notifications` rows.
5. Fires Resend emails to recipients on `realtime` digest preference.

**These dispatch calls must be `await`ed**, not fire-and-forget. See "Vercel gotchas" below.

### Apify website-screenshot pipeline

When a markup is created with `type=website`, `POST /api/markups` calls `kickWebsiteScreenshot` from `src/lib/apify/screenshot.ts`. That:

1. Starts an `apify/screenshot-url` actor run via the SDK with a webhook pointing at `/api/apify/webhook?markup_id=…&uploaded_by=…`.
2. The kick is `await`ed (HTTP POST, ~1–2 s) — required because Vercel kills the serverless function as soon as the response returns. **Never `void`** this call.
3. On `ACTOR.RUN.SUCCEEDED`, our webhook receiver fetches the PNG from the run's KV store, uploads to the `screenshots` Supabase bucket at `<workspace>/<markup>/v1.png`, sets a 1-year signed `thumbnail_url`, and upserts a `markup_versions` row (idempotent against duplicate webhook deliveries).

### Folder drag-and-drop

`src/components/workspace/folders-context.tsx` lifts the workspace's folder tree into a context (`FoldersProvider` wraps `(app)/w/[workspaceId]/layout.tsx`'s children). Drag uses HTML5 native dataTransfer with the typed key `MARKUP_DRAG_TYPE = "application/x-beam-markup"` — `MarkupCard` sets it on `dragstart`, folder rows in `FolderTree` and the Sidebar's "All Projects" link consume it on `drop`. Both call `PATCH /api/markups/[id]` with `folder_id`.

### Guest view drawers

`src/app/share/[token]/page.tsx` resolves the token via `src/lib/share/resolve.ts` (service-role read), then renders `GuestCanvas`. Both the comments rail (left) and versions rail (right) are hidden by default; hamburger buttons in the top bar slide them in. `Esc` closes whichever is open. The comment list is read-only (`GuestCommentList` doesn't depend on `CanvasStateProvider`); guests still post via `GuestPinComposer` → `POST /api/share/[token]/threads` (service-role server-side, identity captured in `localStorage` via `useGuestIdentity`).

## API surface

Auth + workspace ops live under `src/app/api/`. Notable routes:

- `/api/markups` POST/PATCH/DELETE plus `/markups/[id]/approve`, `/markups/[id]/versions[/[versionId]]`
- `/api/threads` POST + `/threads/[id]` PATCH/DELETE + `/threads/[id]/messages` POST
- `/api/share-links` POST + `/share-links/[id]` PATCH/DELETE
- `/api/share/[token]/threads[/[threadId]/messages]` — public guest endpoints
- `/api/invites` POST (Resend-backed) + `/invites/[token]/accept`
- `/api/workspaces/[id]` PATCH/DELETE + `/members/[userId]` PATCH/DELETE + `/leave`
- `/api/profile` PATCH, `/api/notification-preferences` PATCH, `/api/notifications/[id]/read`, `/api/notifications/read-all`
- `/api/upload/sign` — signed direct-upload URLs into `markup-files`
- `/api/apify/webhook` — Apify run completion handler
- `/api/auth/probe-email` — surfaces "confirmed / unconfirmed / unknown" so the signup form can adapt to existing-user cases

## Vercel gotchas (learned the hard way)

1. **No fire-and-forget Promises.** Vercel terminates serverless functions the moment the response returns. `void someAsyncCall()` will be killed mid-flight. Always `await` external HTTP calls (Apify kick, Resend send, dispatchNotifications). The cost is small (~1 s) and the alternative is silent breakage.
2. **`.gitignore` patterns must be anchored.** A bare `supabase/` in `.gitignore` once matched `src/lib/supabase/` and Vercel built without our auth clients. Use `/supabase/` (root-anchored) for the Supabase CLI temp dir.
3. **Image domains** — every Supabase Storage hostname needs to be in `next.config.ts:images.remotePatterns`. The current entry derives it from `NEXT_PUBLIC_SUPABASE_URL`.

## Stitch designs

Designs live in a Stitch project named "Beam Internal Markup Tool". The Stitch MCP is wired via `claude mcp add stitch --transport http --url https://stitch.googleapis.com/mcp -H "X-Goog-Api-Key: …"`. To pick up a different account's API key, replace the user-scope MCP and restart Claude Code (mid-session reconnect doesn't work). Use `mcp__stitch__list_projects` → `list_screens` → `get_screen`, then download the HTML via the returned `htmlCode.downloadUrl`. Treat designs as the source of truth for layout / spacing — don't improvise.

## Performance posture

- Server queries on the canvas page are parallelized in three phases (`Promise.all`): auth + markup → member / version / threads / siblings → profiles + signed URL.
- Signed URLs are 24-hour TTL so the browser cache hits across navigations.
- Optimistic UI on every canvas mutation; realtime payloads merge into the same store. No `router.refresh()` for self-actions.
- Sibling images preload via SSR `<link rel="preload">` + client-side `new Image()` + `router.prefetch()`.

When something feels slow, profile in this order: image size (Apify PNG can be 5+ MB), server query waterfall, then client work.
