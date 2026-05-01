# BEAM — Tech Stack, File Structure, and Setup

> Companion to `PROJECT_BRIEF.md`. Use for exact deps, env vars, file structure, step-by-step setup.

---

## 1. Versions (use latest stable as of build time)

| Tool | Version |
|---|---|
| Node.js | 22 LTS or latest LTS |
| pnpm | 9.x (preferred over npm/yarn for speed) |
| Next.js | 15.x (App Router) |
| React | 19.x (latest stable) |
| TypeScript | 5.x (strict mode) |
| Tailwind CSS | v4.x |
| @supabase/supabase-js | v2 latest |
| @supabase/ssr | latest |
| shadcn/ui | latest CLI |

Run `pnpm dlx <pkg>@latest` for newest. Don't pin old versions unless known breaking change.

---

## 2. Dependencies

### Production
```bash
pnpm add next react react-dom
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add zustand
pnpm add react-hook-form @hookform/resolvers zod
pnpm add pdfjs-dist
pnpm add lucide-react
pnpm add resend
pnpm add date-fns
pnpm add vaul                          # for mobile bottom sheet
pnpm add framer-motion                  # for pin drop animation, drawer transitions
pnpm add sonner                         # for toast notifications
pnpm add nanoid                         # for share link tokens
pnpm add apify-client                   # optional, for website screenshots
pnpm add tailwind-merge clsx            # for shadcn/ui class composition
```

### Dev
```bash
pnpm add -D typescript @types/react @types/react-dom @types/node
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer
pnpm add -D eslint eslint-config-next
pnpm add -D supabase                    # Supabase CLI for type generation
```

### shadcn/ui components to install (use `pnpm dlx shadcn@latest add <name>`)
```
button input textarea label dialog dropdown-menu select tabs
avatar badge card sheet popover tooltip toast alert
form checkbox switch radio-group separator skeleton
```

---

## 3. Environment Variables

Create `.env.example` (commit):

```bash
# Supabase — get from Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Supabase Management API (for migrations only — not needed in production runtime)
SUPABASE_ACCESS_TOKEN=your-personal-access-token-here
SUPABASE_PROJECT_REF=your-project-ref-id

# Resend
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=Beam <hello@yourdomain.com>

# Apify (optional v1)
APIFY_API_TOKEN=your-apify-token
APIFY_SCREENSHOT_ACTOR_ID=apify/website-screenshot-crawler

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Beam
```

Create `.env.local` (DO NOT commit) with real values. User provides:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://dejxdmycijocbxuaharf.supabase.co`
- `SUPABASE_PROJECT_REF` = `dejxdmycijocbxuaharf`
- Anon key + service role key — fetch via Supabase CLI or ask user
- `RESEND_API_KEY` — user shares separately
- `APIFY_API_TOKEN` — user shares if pursuing website type

⚠️ `SUPABASE_ACCESS_TOKEN` highly sensitive — local setup only. Production runtime not need.

---

## 4. File Structure

```
beam/
├── .env.example
├── .env.local                          # gitignored
├── .gitignore
├── README.md
├── PROJECT_BRIEF.md                    # this project
├── TECH_STACK.md                       # this project
├── DATABASE_SCHEMA.sql                 # this project
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json                     # shadcn/ui config
├── middleware.ts                       # Supabase auth middleware
├── public/
│   ├── favicon.ico
│   └── illustrations/                  # empty-state illustrations
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # root layout, font loading
│   │   ├── globals.css                 # tailwind imports + CSS vars
│   │   ├── page.tsx                    # marketing landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── auth/
│   │   │       ├── callback/route.ts   # Supabase auth callback
│   │   │       └── confirm/route.ts    # email confirm
│   │   ├── (app)/
│   │   │   ├── layout.tsx              # protected layout with sidebar
│   │   │   ├── welcome/page.tsx        # onboarding
│   │   │   └── w/[workspaceId]/
│   │   │       ├── page.tsx            # dashboard
│   │   │       ├── folder/[folderId]/page.tsx
│   │   │       ├── markup/[markupId]/
│   │   │       │   ├── page.tsx        # canvas viewer
│   │   │       │   └── versions/page.tsx
│   │   │       ├── people/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       └── notifications/page.tsx
│   │   ├── share/[token]/page.tsx     # public guest view
│   │   └── api/
│   │       ├── share/[token]/
│   │       │   ├── thread/route.ts     # POST: guest creates thread
│   │       │   └── message/route.ts    # POST: guest creates message
│   │       ├── upload/route.ts         # signed upload URL
│   │       ├── invite/route.ts         # send workspace invite
│   │       └── apify/screenshot/route.ts  # optional website screenshot
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components (auto-generated)
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── signup-form.tsx
│   │   │   └── forgot-password-form.tsx
│   │   ├── workspace/
│   │   │   ├── workspace-switcher.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── mobile-drawer.tsx
│   │   │   └── new-markup-modal.tsx
│   │   ├── dashboard/
│   │   │   ├── markup-card.tsx
│   │   │   ├── markup-grid.tsx
│   │   │   ├── folder-tree.tsx
│   │   │   ├── filter-chips.tsx
│   │   │   └── empty-state.tsx
│   │   ├── canvas/
│   │   │   ├── canvas-viewer.tsx       # main viewer
│   │   │   ├── image-canvas.tsx
│   │   │   ├── pdf-canvas.tsx
│   │   │   ├── pin.tsx
│   │   │   ├── annotation-toolbar.tsx
│   │   │   ├── comment-popover.tsx
│   │   │   ├── comment-panel.tsx       # desktop sidebar
│   │   │   ├── comment-bottom-sheet.tsx # mobile drawer
│   │   │   ├── comment-card.tsx
│   │   │   ├── status-pill.tsx
│   │   │   ├── approve-button.tsx
│   │   │   ├── share-modal.tsx
│   │   │   └── version-selector.tsx
│   │   ├── notifications/
│   │   │   └── notification-row.tsx
│   │   └── shared/
│   │       ├── avatar.tsx
│   │       ├── avatar-stack.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── loading-skeleton.tsx
│   │       └── fab.tsx                 # mobile floating action button
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   ├── server.ts               # server client (RSC + route handlers)
│   │   │   ├── middleware.ts           # session refresh helper
│   │   │   └── service.ts              # service role client (server only)
│   │   ├── resend/
│   │   │   ├── client.ts
│   │   │   └── templates/              # email JSX templates
│   │   ├── apify/
│   │   │   └── screenshot.ts
│   │   ├── utils.ts                    # cn(), formatDate(), etc.
│   │   ├── constants.ts                # app-wide constants
│   │   └── validations/                # Zod schemas
│   │       ├── auth.ts
│   │       ├── workspace.ts
│   │       ├── markup.ts
│   │       └── comment.ts
│   ├── stores/
│   │   ├── canvas-store.ts             # Zustand: zoom, active pin, drawing tool
│   │   └── ui-store.ts                 # sidebar collapsed, modals, etc.
│   ├── hooks/
│   │   ├── use-realtime-thread.ts
│   │   ├── use-realtime-messages.ts
│   │   ├── use-pin-drop.ts
│   │   ├── use-mention-autocomplete.ts
│   │   └── use-mobile.ts               # breakpoint detection
│   └── types/
│       ├── database.ts                  # generated by Supabase CLI
│       └── app.ts                       # app-specific types
└── scripts/
    └── generate-types.sh               # regenerate database types
```

---

## 5. Tailwind v4 config (key tokens)

`globals.css`:
```css
@import "tailwindcss";

@theme {
  /* Fonts */
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;

  /* Colors */
  --color-primary: #4F46E5;
  --color-primary-hover: #4338CA;
  --color-primary-subtle: #EEF2FF;
  --color-background: #FAFAF9;
  --color-surface: #FFFFFF;
  --color-border: #E7E5E4;
  --color-border-strong: #D6D3D1;
  --color-text-primary: #1C1917;
  --color-text-secondary: #57534E;
  --color-text-tertiary: #A8A29E;
  --color-status-draft: #A8A29E;
  --color-status-ready: #0EA5E9;
  --color-status-changes: #F59E0B;
  --color-status-approved: #10B981;
  --color-danger: #DC2626;

  /* Radius */
  --radius-button: 10px;
  --radius-card: 14px;
  --radius-modal: 18px;

  /* Shadows */
  --shadow-card: 0 1px 2px rgba(28,25,23,0.04), 0 4px 12px rgba(28,25,23,0.05);
  --shadow-modal: 0 8px 32px rgba(28,25,23,0.12);
  --shadow-pin: 0 2px 6px rgba(28,25,23,0.18);
}

body {
  background-color: var(--color-background);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

---

## 6. Setup steps (in order)

### Step 1: Initialize project
```bash
pnpm create next-app@latest beam --typescript --tailwind --app --src-dir --use-pnpm --eslint
cd beam
git init
git remote add origin https://github.com/vikasbendha-ops/Project-Beam.git
```

### Step 2: Install dependencies
Run all `pnpm add` commands from Section 2.

### Step 3: Initialize shadcn/ui
```bash
pnpm dlx shadcn@latest init
# Answer: Default style, Neutral base color, CSS variables yes
```
Then install components from Section 2.

### Step 4: Set up Supabase clients
Create `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `service.ts` per official `@supabase/ssr` patterns for Next.js App Router.

### Step 5: Run database schema
Supabase Dashboard → SQL Editor → New Query → paste `DATABASE_SCHEMA.sql` → Run.

Verify all tables exist in Table Editor.

### Step 6: Generate TypeScript types from Supabase
```bash
pnpm dlx supabase gen types typescript --project-id dejxdmycijocbxuaharf > src/types/database.ts
```
(Needs `SUPABASE_ACCESS_TOKEN` env var set when running CLI.)

### Step 7: Configure environment
Copy `.env.example` to `.env.local`, fill real values.

### Step 8: Add middleware for protected routes
`middleware.ts` at project root — refresh Supabase session per request, redirect unauth users to `/login` for `/w/*` routes.

### Step 9: First commit + push
```bash
git add .
git commit -m "Initial Beam scaffolding"
git push -u origin main
```

### Step 10: Build screen by screen
Follow build order in `PROJECT_BRIEF.md` Section 8. Use Stitch MCP to fetch each design.

---

## 7. Supabase client patterns (Next.js 15 App Router)

### Browser client (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server client (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* in RSC */ }
        },
      },
    }
  );
}
```

### Service role client (`src/lib/supabase/service.ts`) — server-only
```typescript
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```
Use service client ONLY in API routes for guest comment writes.

---

## 8. Critical implementation notes

- **PDF rendering:** use `pdfjs-dist` worker properly. Set `pdfjs.GlobalWorkerOptions.workerSrc` to CDN URL or self-hosted worker bundle.
- **Realtime:** subscribe with `supabase.channel('markup-${id}').on('postgres_changes', ...)`. Unsubscribe on unmount.
- **File uploads:** generate signed upload URLs from server action; client uploads direct to Supabase Storage. Validate 50MB before upload.
- **Pin coordinates:** store as percentages (0–100) so pins survive image resize.
- **Mobile bottom sheet:** use `vaul` — supports peek/half/full snap points natively.
- **Mention autocomplete:** trigger on `@` keystroke, query `profiles` table filtered by workspace members.
- **Optimistic updates:** posting comment, append to UI immediately, reconcile with server response.
- **Image-only canvas:** use CSS `transform: scale()` for zoom + `translate()` for pan. Skip canvas API unless drawing freehand.
- **PDF canvas:** render each page to `<canvas>` via pdfjs-dist, stack vertically in scrollable container.

---

## 9. Email templates (Resend)

JSX-based templates via `@react-email/components` (optional but recommended):
```bash
pnpm add @react-email/components
```

Templates needed:
1. Signup confirmation (Supabase Auth — customize template in Supabase Dashboard)
2. Password reset (Supabase Auth)
3. Workspace invite (custom — via Resend)
4. Comment notification (custom — via Resend)
5. Mention notification (custom)
6. Status change notification (custom)

---

## 10. Deployment

User handle Vercel connection. Build command, output dir: defaults work. Set all env vars in Vercel Project Settings → Environment Variables (copy from `.env.local`).

`SUPABASE_ACCESS_TOKEN` NOT needed in Vercel — local only for migrations and type gen.

---

## 11. Post-launch checklist

- [ ] All env vars set in Vercel
- [ ] Supabase Auth → Email confirmation enabled
- [ ] Supabase Auth → Site URL set to production domain
- [ ] Supabase Auth → Redirect URLs include production callback
- [ ] Resend → domain verified, API key in Vercel
- [ ] Test signup flow end-to-end
- [ ] Test guest commenting via share link
- [ ] Test mobile responsiveness on real device
- [ ] Rotate Supabase Personal Access Token (security)