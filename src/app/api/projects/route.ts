import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to create projects here." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: parsed.data.workspace_id,
      name: parsed.data.name,
      color: parsed.data.color ?? "#6366F1",
      created_by: user.id,
    })
    .select("id, name, color")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
