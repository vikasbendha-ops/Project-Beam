# BEAM — Start Here (for Claude Code)

You've been given three files for this project:

1. **PROJECT_BRIEF.md** — what you're building, rules, screen list, build phases
2. **TECH_STACK.md** — dependencies, file structure, env vars, setup steps
3. **DATABASE_SCHEMA.sql** — complete Supabase schema; run this in Supabase Dashboard

## Your first 5 actions

1. **Read all three files end-to-end before writing any code.**
2. Confirm with the user:
   - Do you want me to run `DATABASE_SCHEMA.sql` via Supabase Management API using your access token, or will you paste it into the Supabase Dashboard SQL Editor yourself? (Recommended: paste it yourself — simpler and you can verify.)
   - Are your Supabase Anon Key and Service Role Key ready? (Find them in Supabase Dashboard → Project Settings → API.)
   - Is Resend API key ready, or should I stub email sending for now?
   - Should I attempt the website type via Apify in v1, or skip and ship image + PDF only?
3. Initialize the Next.js 15 + TypeScript + Tailwind v4 project per `TECH_STACK.md` Section 6.
4. Set up the GitHub repo and push the initial scaffold to `https://github.com/vikasbendha-ops/Project-Beam.git`.
5. Set up the Stitch MCP connection and verify you can fetch designs.

## Then start Phase 2

Build vertical slices following `PROJECT_BRIEF.md` Section 8 (Auth → Workspace → Upload → Canvas → Sharing → Versioning → Polish).

## Hard reminders

- **NO hardcoded mock data.** Every data point shown to the user must come from Supabase. The Stitch designs show data — that data must be created via the actual app's UI flows after schema is deployed.
- **NO secrets in code.** All keys go in `.env.local`, referenced via `process.env`.
- **TypeScript strict mode.** Zero `any`. Zero compilation errors before commits.
- **Mobile-first.** Every screen must work pixel-perfect on phone, tablet, desktop.
- **Use Stitch MCP** for every design — don't improvise UI layouts.
- **Light theme only.** No dark mode.

## When stuck, ask

If a Stitch design is missing, a Supabase keyword behaves unexpectedly, or a requirement is ambiguous — ask the user. Don't guess.

Good luck. Build it clean. ⚡
