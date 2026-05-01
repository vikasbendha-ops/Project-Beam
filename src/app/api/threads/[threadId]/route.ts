import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchThreadSchema } from "@/lib/validations/thread";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { threadId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = patchThreadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: {
    status?: "open" | "resolved";
    priority?: "none" | "low" | "medium" | "high";
    x_position?: number;
    y_position?: number;
    page_number?: number | null;
    resolved_at?: string | null;
    resolved_by?: string | null;
  } = {};
  if (parsed.data.priority !== undefined)
    updates.priority = parsed.data.priority;
  if (parsed.data.x_position !== undefined)
    updates.x_position = parsed.data.x_position;
  if (parsed.data.y_position !== undefined)
    updates.y_position = parsed.data.y_position;
  if (parsed.data.page_number !== undefined)
    updates.page_number = parsed.data.page_number;
  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
    if (parsed.data.status === "resolved") {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.id;
    } else {
      updates.resolved_at = null;
      updates.resolved_by = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("threads")
    .update(updates)
    .eq("id", threadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { threadId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("threads").delete().eq("id", threadId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
