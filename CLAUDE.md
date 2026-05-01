# CLAUDE.md

This file guide Claude Code (claude.ai/code) when work with code in repo.

## Project — Beam

Internal visual-feedback web app inspired by markup.io. Users upload images / PDFs (or paste URLs screenshotted via Apify), drop pin-comments anchored to exact positions, share with reviewers, approve.

Source-of-truth specs live with code:

- `PROJECT_BRIEF.md` — product brief, hard rules (light theme only, no mock data, email + password auth only), screen list, 8-phase build order
- `TECH_STACK.md` — exact deps, env vars, file structure, Supabase client patterns
- `DATABASE_SCHEMA.sql` — full Postgres schema (deployed to Supabase via Management API)
- `START_HERE.md` — bootstrap checklist

## Critical: This is **not** the Next.js you know

On **Next.js 16 + Turbopack + React 19**. APIs, conventions, file structure differ from old training data. Read `node_modules/next/dist/docs/` before touch framework internals. Heed deprecation notices.

## Commands

```bash
pnpm dev                # Next dev server (Turbopack)
pnpm build              # Production build (Turbopack, includes typecheck)
pnpm exec tsc --noEmit  # Standalone TS check (faster than full build)
pnpm lint               # ESLint with eslint-config-next

./scripts/generate-types.sh   # Regenerate src/types/database.ts from live Supabase
                              # Reads SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF from .env.local
```

No test scripts — project ship without Jest/Vitest. Verify with `pnpm exec tsc --noEmit && pnpm build`.

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

`middleware.ts` (root) wraps every request through `src/lib/supabase/middleware.ts:updateSession` — refresh Supabase session cookie, 302 unauth traffic away from `/w/*` and `/welcome`.

### Supabase clients — four variants, pick right one

`src/lib/supabase/`:

- `client.ts` — `createBrowserClient` for client components.
- `server.ts` — `createServerClient` (cookies via `next/headers`) for Server Components + Route Handlers.
- `service.ts` — service-role client. **Only use** for: public guest endpoints (`/api/share/[token]/*`), backend notification dispatch, Apify webhook persist, email-probe endpoint. Never grab just to bypass RLS.
- `middleware.ts` — session-refresh helper for root middleware.

Generated types live in `src/types/database.ts`. Re-run `scripts/generate-types.sh` after schema change.

### Canvas viewer (HERO screen)

`src/components/canvas/` — most complex subsystem. Key file: `canvas-state.tsx`.

- **`CanvasStateProvider`** holds threads in `useReducer` store. Mutators (`createThread`, `postReply`, `setThreadStatus`, `deleteThread`, `deleteMessage`) **optimistic**: patch local state now, fire API in background, replace temp IDs on success, roll back on error. No `router.refresh()` after self-actions.
- Provider's `useEffect` subscribes to Supabase Realtime (`postgres_changes` on `threads` + `messages`). Inbound payloads merge into same store — other users' edits land without server round-trip.
- **`ImageCanvas`** owns pan/zoom (Cmd/Ctrl+wheel cursor-centred zoom, hold-Space-drag or middle-mouse pan, three fit modes: fit-width / fit-height / actual×zoom). Uses plain `<img>` (not `next/image`) so we control sizing for arbitrary zoom.
- **Pin coords are percentages** of image's intrinsic dims, stored as `threads.x_position` / `y_position`. Survive resize, fit-mode change, zoom.
- **`renderOverlay` slot** — `ImageCanvas` exposes one render-prop mounted inside image stage. Both `PendingPinComposer` (new pin) and `ThreadPopover` (active thread) go through it so `left/top` percentages share same coordinate space as pins. **Anything anchored to pin position must render through this slot, not as sibling of `ImageCanvas`.**
- `loading.tsx` next to canvas page renders full layout skeleton during nav, plus page emits `<link rel="preload" as="image">` for prev/next siblings, `SiblingPreloader` does `router.prefetch()` + `new Image()` warm-up on mount.

### Notification dispatch

`src/lib/notifications/dispatch.ts:dispatchNotifications` called from every mutating thread/message/approve route. It:

1. Resolves workspace members minus actor.
2. Loads global prefs (`notification_preferences`) + per-markup overrides (`markup_notification_settings`).
3. Filters: `off` users only notified if explicit `@`-mention; `mentions` same; `all` get everything.
4. Batch-inserts `notifications` rows.
5. Fires Resend emails to recipients on `realtime` digest pref.

**Dispatch calls must be `await`ed**, not fire-and-forget. See "Vercel gotchas" below.

### Apify website-screenshot pipeline

When markup created with `type=website`, `POST /api/markups` calls `kickWebsiteScreenshot` from `src/lib/apify/screenshot.ts`. That:

1. Starts `apify/screenshot-url` actor run via SDK with webhook pointing at `/api/apify/webhook?markup_id=…&uploaded_by=…`.
2. Kick `await`ed (HTTP POST, ~1–2 s) — required because Vercel kills serverless function as soon as response returns. **Never `void`** this call.
3. On `ACTOR.RUN.SUCCEEDED`, webhook receiver fetches PNG from run's KV store, uploads to `screenshots` Supabase bucket at `<workspace>/<markup>/v1.png`, sets 1-year signed `thumbnail_url`, upserts `markup_versions` row (idempotent against duplicate webhook delivery).

### Folder drag-and-drop

`src/components/workspace/folders-context.tsx` lifts workspace's folder tree into context (`FoldersProvider` wraps `(app)/w/[workspaceId]/layout.tsx`'s children). Drag uses HTML5 native dataTransfer with typed key `MARKUP_DRAG_TYPE = "application/x-beam-markup"` — `MarkupCard` sets on `dragstart`, folder rows in `FolderTree` and Sidebar's "All Projects" link consume on `drop`. Both call `PATCH /api/markups/[id]` with `folder_id`.

### Guest view drawers

`src/app/share/[token]/page.tsx` resolves token via `src/lib/share/resolve.ts` (service-role read), then renders `GuestCanvas`. Comments rail (left) and versions rail (right) hidden by default; hamburger buttons in top bar slide them in. `Esc` closes whichever open. Comment list read-only (`GuestCommentList` no depend on `CanvasStateProvider`); guests post via `GuestPinComposer` → `POST /api/share/[token]/threads` (service-role server-side, identity captured in `localStorage` via `useGuestIdentity`).

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
- `/api/auth/probe-email` — surfaces "confirmed / unconfirmed / unknown" so signup form adapt to existing-user cases

## Vercel gotchas (learned hard way)

1. **No fire-and-forget Promises.** Vercel terminates serverless functions moment response returns. `void someAsyncCall()` killed mid-flight. Always `await` external HTTP calls (Apify kick, Resend send, dispatchNotifications). Cost small (~1 s); alternative silent breakage.
2. **`.gitignore` patterns must be anchored.** Bare `supabase/` in `.gitignore` once matched `src/lib/supabase/` and Vercel built without auth clients. Use `/supabase/` (root-anchored) for Supabase CLI temp dir.
3. **Image domains** — every Supabase Storage hostname needs entry in `next.config.ts:images.remotePatterns`. Current entry derives from `NEXT_PUBLIC_SUPABASE_URL`.

## Stitch designs

Designs live in Stitch project "Beam Internal Markup Tool". Stitch MCP wired via `claude mcp add stitch --transport http --url https://stitch.googleapis.com/mcp -H "X-Goog-Api-Key: …"`. To pick up different account's API key, replace user-scope MCP and restart Claude Code (mid-session reconnect no work). Use `mcp__stitch__list_projects` → `list_screens` → `get_screen`, then download HTML via returned `htmlCode.downloadUrl`. Treat designs as source of truth for layout / spacing — no improvise.

## Performance posture

- Server queries on canvas page parallelized in three phases (`Promise.all`): auth + markup → member / version / threads / siblings → profiles + signed URL.
- Signed URLs 24-hour TTL so browser cache hit across navs.
- Optimistic UI on every canvas mutation; realtime payloads merge into same store. No `router.refresh()` for self-actions.
- Sibling images preload via SSR `<link rel="preload">` + client-side `new Image()` + `router.prefetch()`.
- When slow, profile in order: image size (Apify PNG can be 5+ MB), server query waterfall, then client work.