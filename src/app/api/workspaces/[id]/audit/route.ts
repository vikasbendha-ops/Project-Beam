import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

/**
 * GET /api/workspaces/[id]/audit?limit=N
 *
 * Workspace-wide audit feed for the Settings → Audit log tab. Pulls from
 * the `notifications` table (already the source of truth for every
 * dispatched event) and joins triggerer profile + markup title for the
 * row formatter on the client. Workspace membership enforced.
 */
export async function GET(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(MAX_LIMIT, Math.max(1, rawLimit))
    : DEFAULT_LIMIT;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabase
    .from("notifications")
    .select(
      "id, type, content_preview, created_at, triggered_by, triggered_by_guest_name, markup_id",
    )
    .eq("workspace_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const triggererIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.triggered_by)
        .filter(Boolean) as string[],
    ),
  );
  const markupIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.markup_id)
        .filter(Boolean) as string[],
    ),
  );

  const [{ data: profiles }, { data: markups }] = await Promise.all([
    triggererIds.length
      ? supabase
          .from("profiles")
          .select("id, name")
          .in("id", triggererIds)
      : Promise.resolve({
          data: [] as { id: string; name: string }[],
        }),
    markupIds.length
      ? supabase
          .from("markups")
          .select("id, title")
          .in("id", markupIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  const markupMap = new Map((markups ?? []).map((m) => [m.id, m.title]));

  return NextResponse.json({
    rows: (rows ?? []).map((r) => ({
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      content_preview: r.content_preview,
      triggered_by_name:
        (r.triggered_by && profileMap.get(r.triggered_by)) ||
        r.triggered_by_guest_name ||
        null,
      markup_title: r.markup_id ? markupMap.get(r.markup_id) ?? null : null,
    })),
  });
}
