import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB per file

const bodySchema = z.object({
  workspace_id: z.string().uuid(),
  filename: z.string().min(1).max(200),
  mime_type: z.string().min(1).max(120),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

/**
 * Sign upload URL for a single comment-attachment file. Bucket = attachments.
 * Browser PUTs the file then sends the returned `path` + `signed_url` (read)
 * back as part of the message attachments array.
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

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", parsed.data.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) {
    return NextResponse.json(
      { error: "You don't have permission to upload here." },
      { status: 403 },
    );
  }

  const ext = parsed.data.filename.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExt = ext.replace(/[^a-z0-9]/g, "");
  const path = `${parsed.data.workspace_id}/${user.id}/${nanoid(20)}.${safeExt}`;

  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create upload URL" },
      { status: 500 },
    );
  }

  // 7-day signed read URL — long enough for any reasonable session and for
  // emails to render images embedded by reference. Refresh on view if expired.
  const { data: read } = await supabase.storage
    .from("attachments")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  return NextResponse.json({
    bucket: "attachments",
    path,
    token: data.token,
    signed_url: data.signedUrl,
    read_url: read?.signedUrl ?? null,
  });
}
