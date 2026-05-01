import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/search?workspace_id=…&q=…
 *
 * Searches markups in the current workspace by title or source URL.
 * Returns up to 15 hits ordered by recency. Used by the Cmd+K palette.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspace_id");
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspace_id required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("markup_summary")
    .select("id, title, type, status, thumbnail_url, folder_id, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(15);

  if (q) {
    const escaped = q.replace(/[%_,]/g, (c) => `\\${c}`);
    query = query.or(
      `title.ilike.%${escaped}%,source_url.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ markups: data ?? [] });
}
