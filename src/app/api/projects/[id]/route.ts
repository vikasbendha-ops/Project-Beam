import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  archived: z.boolean().optional(),
});

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
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
  if (Object.keys(parsed.data).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { error } = await supabase
    .from("projects")
    .update(parsed.data)
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Don't allow deleting the last project — every workspace needs >= 1.
  const { data: row } = await supabase
    .from("projects")
    .select("workspace_id")
    .eq("id", id)
    .maybeSingle();
  if (!row)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", row.workspace_id);
  if ((count ?? 0) <= 1)
    return NextResponse.json(
      {
        error:
          "Can't delete the last project. Create another first, then delete this one.",
      },
      { status: 400 },
    );

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
