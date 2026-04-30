import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kickWebsiteScreenshot } from "@/lib/apify/screenshot";

const fileMeta = z
  .object({
    storage_path: z.string().min(1),
    file_size: z.number().int().positive(),
    file_name: z.string().min(1).max(200),
    mime_type: z.string().min(1).max(120),
  })
  .partial();

const bodySchema = z.object({
  workspace_id: z.string().uuid(),
  folder_id: z.string().uuid().nullable().optional(),
  type: z.enum(["image", "pdf", "website"]),
  title: z.string().trim().min(1).max(120),
  source_url: z.string().url().optional(),
  file: fileMeta.optional(),
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

  const { workspace_id, folder_id, type, title, source_url, file } =
    parsed.data;

  // Membership + role check.
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to create markups here." },
      { status: 403 },
    );
  }

  // Type-specific validation.
  if (type === "website" && !source_url) {
    return NextResponse.json(
      { error: "URL is required for website markups." },
      { status: 400 },
    );
  }
  if ((type === "image" || type === "pdf") && !file?.storage_path) {
    return NextResponse.json(
      { error: "Uploaded file metadata is required." },
      { status: 400 },
    );
  }

  // For image markups, persist a signed thumbnail URL (1-year TTL —
  // refreshed by view-time logic when expired). markup-files is a private
  // bucket so getPublicUrl would 404.
  let thumbnailUrl: string | null = null;
  if (file?.storage_path && type === "image") {
    const { data: signed } = await supabase.storage
      .from("markup-files")
      .createSignedUrl(file.storage_path, 60 * 60 * 24 * 365);
    thumbnailUrl = signed?.signedUrl ?? null;
  }

  const { data: markup, error: insertError } = await supabase
    .from("markups")
    .insert({
      workspace_id,
      folder_id: folder_id ?? null,
      type,
      title,
      source_url: source_url ?? null,
      thumbnail_url: thumbnailUrl,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !markup) {
    return NextResponse.json(
      { error: insertError?.message ?? "Insert failed" },
      { status: 500 },
    );
  }

  // For image/pdf, create the initial markup_versions row pointing at the
  // uploaded file. The DB has a unique(markup_id, version_number) constraint
  // and a is_current flag — version 1 starts current.
  if ((type === "image" || type === "pdf") && file?.storage_path) {
    const { error: versionError } = await supabase
      .from("markup_versions")
      .insert({
        markup_id: markup.id,
        version_number: 1,
        file_url: file.storage_path,
        file_name: file.file_name ?? null,
        file_size: file.file_size ?? null,
        mime_type: file.mime_type ?? null,
        uploaded_by: user.id,
        is_current: true,
      });
    if (versionError) {
      // Roll back the markup so we don't leave a versionless row.
      await supabase.from("markups").delete().eq("id", markup.id);
      return NextResponse.json(
        { error: versionError.message },
        { status: 500 },
      );
    }
  }

  // For website type, kick the Apify screenshot run in the background.
  // We don't await it — the function returns immediately and the worker
  // updates `markups.thumbnail_url` + creates the markup_versions row when
  // the actor completes. Realtime listeners refresh the dashboard card.
  if (type === "website" && source_url) {
    void kickWebsiteScreenshot({
      markupId: markup.id,
      sourceUrl: source_url,
      uploadedBy: user.id,
    });
  }

  return NextResponse.json({ id: markup.id }, { status: 201 });
}
