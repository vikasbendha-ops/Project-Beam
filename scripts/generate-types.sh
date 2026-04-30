#!/usr/bin/env bash
# Regenerate src/types/database.ts from the live Supabase schema.
# Requires SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF in .env.local.

set -euo pipefail

# shellcheck disable=SC1091
set -a
[ -f .env.local ] && . .env.local
set +a

: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN must be set in .env.local}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF must be set in .env.local}"

mkdir -p src/types
pnpm dlx supabase@latest gen types typescript \
  --project-id "$SUPABASE_PROJECT_REF" \
  --schema public \
  > src/types/database.ts

echo "✔ src/types/database.ts updated."
