import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  workspace_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable().optional(),
  type: z.enum(["image", "pdf", "website"]),
  title: z.string().trim().min(1).max(120),
  source_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Membership check — RLS will also enforce, but fail fast w/ clear error
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to create markups here." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("markups")
    .insert({
      workspace_id: parsed.data.workspace_id,
      folder_id: parsed.data.folder_id ?? null,
      type: parsed.data.type,
      title: parsed.data.title,
      source_url: parsed.data.source_url ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
