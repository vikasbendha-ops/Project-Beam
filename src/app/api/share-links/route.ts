import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createShareLinkSchema } from "@/lib/validations/share";

/**
 * POST /api/share-links — auth members create a public share link for a
 * markup / folder / workspace. Token defaults to a hex UUID via the table
 * default and is unique. Returns the row.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createShareLinkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Resolve the workspace_id we need to authorise against.
  let workspaceId: string | null = parsed.data.workspace_id ?? null;
  if (!workspaceId && parsed.data.markup_id) {
    const { data: m } = await supabase
      .from("markups")
      .select("workspace_id")
      .eq("id", parsed.data.markup_id)
      .maybeSingle();
    workspaceId = m?.workspace_id ?? null;
  }
  if (!workspaceId && parsed.data.folder_id) {
    const { data: f } = await supabase
      .from("folders")
      .select("workspace_id")
      .eq("id", parsed.data.folder_id)
      .maybeSingle();
    workspaceId = f?.workspace_id ?? null;
  }
  if (!workspaceId)
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to share here." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      markup_id: parsed.data.markup_id ?? null,
      folder_id: parsed.data.folder_id ?? null,
      workspace_id: parsed.data.workspace_id ?? null,
      can_comment: parsed.data.can_comment ?? true,
      expires_at: parsed.data.expires_at ?? null,
      created_by: user.id,
    })
    .select("id, token, can_comment, expires_at, is_active, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Couldn't create share link" },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
