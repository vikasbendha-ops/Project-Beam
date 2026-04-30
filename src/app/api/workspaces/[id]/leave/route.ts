import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Current user removes their own membership. Owner uses DELETE workspace. */
export async function POST(_request: NextRequest, ctx: RouteContext) {
  const { id: workspaceId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id, is_personal")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id === user.id)
    return NextResponse.json(
      { error: "The owner can't leave. Delete the workspace or transfer ownership." },
      { status: 400 },
    );

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
