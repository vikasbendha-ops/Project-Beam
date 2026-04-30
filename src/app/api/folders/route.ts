import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MAX_FOLDER_DEPTH } from "@/lib/constants";

const bodySchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  parent_folder_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Membership + role check (RLS double-checks).
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to create folders here." },
      { status: 403 },
    );
  }

  // Depth check: walk up parent chain, fail if > MAX_FOLDER_DEPTH.
  if (parsed.data.parent_folder_id) {
    let depth = 1;
    let cursor: string | null = parsed.data.parent_folder_id;
    while (cursor && depth <= MAX_FOLDER_DEPTH) {
      const result: {
        data: { id: string; parent_folder_id: string | null; workspace_id: string } | null;
      } = await supabase
        .from("folders")
        .select("id, parent_folder_id, workspace_id")
        .eq("id", cursor)
        .maybeSingle();
      const parent = result.data;
      if (!parent || parent.workspace_id !== parsed.data.workspace_id) {
        return NextResponse.json(
          { error: "Parent folder not found in this workspace." },
          { status: 400 },
        );
      }
      cursor = parent.parent_folder_id;
      depth += 1;
    }
    if (depth > MAX_FOLDER_DEPTH) {
      return NextResponse.json(
        { error: `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels.` },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      workspace_id: parsed.data.workspace_id,
      parent_folder_id: parsed.data.parent_folder_id ?? null,
      name: parsed.data.name,
      created_by: user.id,
    })
    .select("id, name, parent_folder_id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
