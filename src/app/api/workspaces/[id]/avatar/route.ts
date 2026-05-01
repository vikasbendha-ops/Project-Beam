import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * POST /api/workspaces/[id]/avatar — owner uploads a workspace avatar.
 * Body: raw image/* bytes (PNG/JPG/WebP). Stored at
 * markup-files/<wsId>/workspace-avatar.<ext>; the signed URL is written
 * back to workspaces.avatar_url for use in the sidebar / switcher.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
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
  if (buf.byteLength === 0) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }
  if (buf.byteLength > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "Avatar too large (max 2 MB)" }, {
      status: 413,
    });
  }
  const bytes = new Uint8Array(buf);

  // Owner check.
  const { data: ws } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can change the workspace avatar." },
      { status: 403 },
    );
  }

  const ext = contentType.split("/")[1]?.split("+")[0] ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  const path = `${id}/workspace-avatar.${safeExt}`;

  const service = createServiceClient();
  const { error: upErr } = await service.storage
    .from("markup-files")
    .upload(path, bytes, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: signed } = await service.storage
    .from("markup-files")
    .createSignedUrl(path, ONE_YEAR);
  if (!signed?.signedUrl) {
    return NextResponse.json(
      { error: "Couldn't sign avatar URL" },
      { status: 500 },
    );
  }

  await service
    .from("workspaces")
    .update({ avatar_url: signed.signedUrl })
    .eq("id", id);

  return NextResponse.json({ avatar_url: signed.signedUrl });
}

/** DELETE /api/workspaces/[id]/avatar — owner clears the avatar. */
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the owner can change the workspace avatar." },
      { status: 403 },
    );

  await createServiceClient()
    .from("workspaces")
    .update({ avatar_url: null })
    .eq("id", id);
  return NextResponse.json({ ok: true });
}
