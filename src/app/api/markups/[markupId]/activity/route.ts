import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

/**
 * GET /api/markups/[id]/activity — returns the audit timeline for one
 * markup. Reuses the `notifications` table since every workspace event
 * already lands there (status changes, comments, resolves, shares,
 * approves). Membership check enforced; guests denied.
 *
 * Returned rows are stripped to display fields + joined triggerer name.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: markup } = await supabase
    .from("markups")
    .select("id, workspace_id")
    .eq("id", markupId)
    .maybeSingle();
  if (!markup)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", markup.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: rows } = await supabase
    .from("notifications")
    .select(
      "id, type, content_preview, created_at, triggered_by, triggered_by_guest_name",
    )
    .eq("markup_id", markupId)
    .order("created_at", { ascending: false })
    .limit(80);

  const triggererIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.triggered_by)
        .filter(Boolean) as string[],
    ),
  );
  const { data: profiles } = triggererIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", triggererIds)
    : { data: [] as { id: string; name: string; avatar_url: string | null }[] };

  return NextResponse.json({
    rows: rows ?? [],
    profiles: profiles ?? [],
  });
}
