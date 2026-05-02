import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchShareLinkSchema } from "@/lib/validations/share";

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

  const json = await request.json().catch(() => null);
  const parsed = patchShareLinkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: {
    is_active?: boolean;
    can_comment?: boolean;
    can_view_comments?: boolean;
    expires_at?: string | null;
  } = {};
  if (parsed.data.is_active !== undefined)
    updates.is_active = parsed.data.is_active;
  if (parsed.data.can_comment !== undefined)
    updates.can_comment = parsed.data.can_comment;
  if (parsed.data.can_view_comments !== undefined)
    updates.can_view_comments = parsed.data.can_view_comments;
  if (parsed.data.expires_at !== undefined)
    updates.expires_at = parsed.data.expires_at;
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase
    .from("share_links")
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
  const { error } = await supabase
    .from("share_links")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
