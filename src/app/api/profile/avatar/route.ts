import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * POST /api/profile/avatar — current user uploads their own avatar.
 * Body: raw image/* (PNG / JPG / WebP). Stored at
 * markup-files/profile-<userId>/avatar.<ext>; signed URL is persisted
 * to profiles.avatar_url for use throughout the app (top-nav, comments,
 * audit log).
 */
export async function POST(request: NextRequest) {
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

  const buf = await request.arrayBuffer();
  if (buf.byteLength === 0)
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  if (buf.byteLength > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: "Avatar too large (max 2 MB)" },
      { status: 413 },
    );
  }
  const bytes = new Uint8Array(buf);

  const ext = contentType.split("/")[1]?.split("+")[0] ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  // Profile avatars live under a separate prefix so workspace storage RLS
  // (which checks path[1] for workspace_id) doesn't collide.
  const path = `profile-${user.id}/avatar.${safeExt}`;

  const service = createServiceClient();
  const { error: upErr } = await service.storage
    .from("markup-files")
    .upload(path, bytes, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: signed } = await service.storage
    .from("markup-files")
    .createSignedUrl(path, ONE_YEAR);
  if (!signed?.signedUrl)
    return NextResponse.json(
      { error: "Couldn't sign avatar URL" },
      { status: 500 },
    );

  await service
    .from("profiles")
    .update({ avatar_url: signed.signedUrl })
    .eq("id", user.id);

  return NextResponse.json({ avatar_url: signed.signedUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await createServiceClient()
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  return NextResponse.json({ ok: true });
}
