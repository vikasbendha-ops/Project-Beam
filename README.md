# Beam

> Faster feedback on websites, images, and PDFs.

Internal visual-feedback web app inspired by markup.io. Upload images / PDFs, drop pin-style comments anchored to exact positions, share with reviewers, approve. Built for agencies and internal teams.

---

## Stack

- **Next.js 16** (App Router, Server Components by default) + **React 19**
- **TypeScript** strict mode
- **Tailwind CSS v4** + **shadcn/ui**
- **Supabase** (Auth + Postgres + Storage + Realtime)
- **Zustand** (canvas state) + **React Hook Form** + **Zod**
- **pdfjs-dist** for PDF rendering
- **Resend** for transactional email
- **Apify** (optional v1) for website screenshots

Full spec: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md), [`TECH_STACK.md`](TECH_STACK.md), [`DATABASE_SCHEMA.sql`](DATABASE_SCHEMA.sql).

---

## Local setup

```bash
pnpm install
cp .env.example .env.local   # then fill in real values
pnpm dev
```

App runs at <http://localhost:3000>.

### Required env vars

See `.env.example`. The Supabase **anon** + **service-role** keys come from the project's API settings page; the **access token** is a personal-access token used only locally for migrations and type generation.

### Database

Schema lives in [`DATABASE_SCHEMA.sql`](DATABASE_SCHEMA.sql) and is already deployed to the connected Supabase project. To re-deploy from scratch, paste the file into Supabase Dashboard → SQL Editor.

### Regenerate Supabase types

```bash
./scripts/generate-types.sh
```

Writes `src/types/database.ts` from the live schema using the access token in `.env.local`.

---

## Build phases

Build proceeds in vertical slices following `PROJECT_BRIEF.md` Section 8:

1. **Foundation** — scaffold, theme, Supabase clients, schema, repo
2. **Auth** — signup / login / forgot password
3. **Workspace + Dashboard** — sidebar, folders, switcher
4. **Upload + MarkUps** — image/PDF upload, grid cards
5. **Canvas viewer** *(hero)* — pins, comments, realtime
6. **Sharing** — share modal, public guest view
7. **Versioning + Notifications** — versions, Resend emails
8. **Polish + optional website type** — settings, Apify

---

## Deployment

Push to `main`, connect Vercel project. All env vars from `.env.local` go into Vercel project settings (the `SUPABASE_ACCESS_TOKEN` is **not** needed in production runtime — only locally).
