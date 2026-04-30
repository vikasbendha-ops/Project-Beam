import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createVersionSchema } from "@/lib/validations/version";

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

/**
 * POST /api/markups/[id]/versions — register a new version after the file
 * has been uploaded via the signed URL flow. Sets the new row as current
 * and flips all prior versions for the markup to is_current=false.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createVersionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Membership check.
  const { data: markup } = await supabase
    .from("markups")
    .select("workspace_id, type")
    .eq("id", markupId)
    .maybeSingle();
  if (!markup)
    return NextResponse.json({ error: "Markup not found" }, { status: 404 });

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", markup.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest")
    return NextResponse.json(
      { error: "You don't have permission to upload versions here." },
      { status: 403 },
    );

  // Compute next version_number.
  const { data: latest } = await supabase
    .from("markup_versions")
    .select("version_number")
    .eq("markup_id", markupId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextNumber = (latest?.version_number ?? 0) + 1;

  // Flip all prior versions to is_current=false.
  await supabase
    .from("markup_versions")
    .update({ is_current: false })
    .eq("markup_id", markupId);

  const { data: created, error: insertError } = await supabase
    .from("markup_versions")
    .insert({
      markup_id: markupId,
      version_number: nextNumber,
      file_url: parsed.data.storage_path,
      file_name: parsed.data.file_name,
      mime_type: parsed.data.mime_type,
      file_size: parsed.data.file_size,
      page_count: parsed.data.page_count ?? null,
      uploaded_by: user.id,
      is_current: true,
    })
    .select("id, version_number")
    .single();

  if (insertError || !created) {
    return NextResponse.json(
      { error: insertError?.message ?? "Couldn't create version" },
      { status: 500 },
    );
  }

  // Refresh the markup thumbnail to point at the new version (image only).
  if (markup.type === "image") {
    const { data: signed } = await supabase.storage
      .from("markup-files")
      .createSignedUrl(parsed.data.storage_path, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) {
      await supabase
        .from("markups")
        .update({ thumbnail_url: signed.signedUrl })
        .eq("id", markupId);
    }
  }

  return NextResponse.json(
    { id: created.id, version_number: created.version_number },
    { status: 201 },
  );
}
