import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

const ALLOWED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;

const bodySchema = z.object({
  workspace_id: z.string().uuid(),
  filename: z.string().min(1).max(200),
  mime_type: z.enum(ALLOWED_MIMES),
  size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

/**
 * Returns a signed upload URL the browser uses to PUT the file directly to
 * Supabase Storage (bypasses our serverless function — no payload limit
 * concerns). After upload completes the client calls POST /api/markups
 * with the resulting `storage_path` to register the asset.
 */
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

  // Membership + role check.
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to upload here." },
      { status: 403 },
    );
  }

  // Path layout: <workspace>/<user>/<random>.<ext>
  // RLS policy on storage.objects will check workspace_id from path[1].
  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const path = `${parsed.data.workspace_id}/${user.id}/${nanoid(20)}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from("markup-files")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create upload URL" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    bucket: "markup-files",
    path,
    token: data.token,
    signed_url: data.signedUrl,
  });
}
