import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ markupId: string; versionId: string }>;
}

/** Set this version as the current one (for the "Restore" button). */
export async function PATCH(_request: NextRequest, ctx: RouteContext) {
  const { markupId, versionId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: version } = await supabase
    .from("markup_versions")
    .select("id, file_url")
    .eq("id", versionId)
    .eq("markup_id", markupId)
    .maybeSingle();
  if (!version)
    return NextResponse.json({ error: "Version not found" }, { status: 404 });

  await supabase
    .from("markup_versions")
    .update({ is_current: false })
    .eq("markup_id", markupId);

  const { error } = await supabase
    .from("markup_versions")
    .update({ is_current: true })
    .eq("id", versionId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  if (version.file_url) {
    const { data: signed } = await supabase.storage
      .from("markup-files")
      .createSignedUrl(version.file_url, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) {
      await supabase
        .from("markups")
        .update({ thumbnail_url: signed.signedUrl })
        .eq("id", markupId);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const { markupId, versionId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: version } = await supabase
    .from("markup_versions")
    .select("is_current")
    .eq("id", versionId)
    .eq("markup_id", markupId)
    .maybeSingle();
  if (!version)
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  if (version.is_current)
    return NextResponse.json(
      { error: "Can't delete the current version. Restore another first." },
      { status: 400 },
    );

  const { error } = await supabase
    .from("markup_versions")
    .delete()
    .eq("id", versionId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
