import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchMemberSchema } from "@/lib/validations/settings";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id: workspaceId, userId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only the owner can change roles.
  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the owner can change roles." },
      { status: 403 },
    );

  const json = await request.json().catch(() => null);
  const parsed = patchMemberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  // Block demoting the owner via this endpoint — preserves the owner row.
  if (userId === ws.owner_id && parsed.data.role !== "owner") {
    return NextResponse.json(
      { error: "Transfer ownership before changing the owner's role." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role: parsed.data.role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { id: workspaceId, userId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the owner can remove members." },
      { status: 403 },
    );
  if (userId === ws.owner_id)
    return NextResponse.json(
      { error: "Can't remove the owner from their own workspace." },
      { status: 400 },
    );

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
