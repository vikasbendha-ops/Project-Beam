import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  archived: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: {
    title?: string;
    folder_id?: string | null;
    archived?: boolean;
  } = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.folder_id !== undefined) updates.folder_id = parsed.data.folder_id;
  if (parsed.data.archived !== undefined) updates.archived = parsed.data.archived;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("markups")
    .update(updates)
    .eq("id", markupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase.from("markups").delete().eq("id", markupId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
