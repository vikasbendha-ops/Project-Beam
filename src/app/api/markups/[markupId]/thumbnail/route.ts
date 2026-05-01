import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

const MAX_THUMB_BYTES = 4 * 1024 * 1024; // 4 MB cap on the captured PNG.
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * POST /api/markups/[id]/thumbnail
 *
 * Body: raw `image/png` bytes captured client-side (page 1 of a PDF,
 * or any other doc renderer that can produce a bitmap).
 *
 * - Members + owners only.
 * - Idempotent: if thumbnail_url is already populated, we still re-upload
 *   (so users can refresh stale thumbnails by re-visiting the canvas) but
 *   we keep the same storage path so old signed URLs continue to work
 *   until they expire.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Expected image/* body" },
      { status: 400 },
    );
  }

  const arrayBuf = await request.arrayBuffer();
  if (arrayBuf.byteLength === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }
  if (arrayBuf.byteLength > MAX_THUMB_BYTES) {
    return NextResponse.json(
      { error: "Thumbnail too large" },
      { status: 413 },
    );
  }
  const bytes = new Uint8Array(arrayBuf);

  // Membership check. RLS would also block, but we want a clean 403.
  const { data: markup } = await supabase
    .from("markups")
    .select("id, workspace_id, thumbnail_url")
    .eq("id", markupId)
    .maybeSingle();
  if (!markup) {
    return NextResponse.json({ error: "Markup not found" }, { status: 404 });
  }
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", markup.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "Members can update thumbnails." },
      { status: 403 },
    );
  }

  // Service client to bypass RLS on the storage upsert + markups update.
  const service = createServiceClient();
  const path = `${markup.workspace_id}/${markupId}/thumb.png`;

  const { error: uploadError } = await service.storage
    .from("markup-files")
    .upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600",
    });
  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 },
    );
  }

  const { data: signed } = await service.storage
    .from("markup-files")
    .createSignedUrl(path, ONE_YEAR);
  if (!signed?.signedUrl) {
    return NextResponse.json(
      { error: "Couldn't sign thumbnail URL" },
      { status: 500 },
    );
  }

  await service
    .from("markups")
    .update({ thumbnail_url: signed.signedUrl })
    .eq("id", markupId);

  return NextResponse.json({ thumbnail_url: signed.signedUrl });
}
