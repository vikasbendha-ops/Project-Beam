import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchWorkspaceSchema } from "@/lib/validations/settings";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only the owner can rename / re-avatar a workspace.
  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id, is_personal")
    .eq("id", id)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the workspace owner can update it." },
      { status: 403 },
    );

  const json = await request.json().catch(() => null);
  const parsed = patchWorkspaceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: { name?: string; avatar_url?: string | null } = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.avatar_url !== undefined)
    updates.avatar_url = parsed.data.avatar_url;
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase
    .from("workspaces")
    .update(updates)
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id, is_personal")
    .eq("id", id)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the owner can delete this workspace." },
      { status: 403 },
    );
  if (ws.is_personal)
    return NextResponse.json(
      { error: "Personal workspaces can't be deleted." },
      { status: 400 },
    );

  const { error } = await supabase.from("workspaces").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
