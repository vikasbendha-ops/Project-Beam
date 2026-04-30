import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuestCanvas } from "@/components/canvas/guest-canvas";
import { resolveShareToken } from "@/lib/share/resolve";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Beam · Review",
};

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;
  const supabase = createServiceClient();
  const share = await resolveShareToken(supabase, token);
  if (!share) notFound();

  const { data: markup } = await supabase
    .from("markups")
    .select(
      "id, title, type, status, source_url, thumbnail_url, workspace_id, archived",
    )
    .eq("id", share.markup_id)
    .maybeSingle();
  if (!markup) notFound();

  const { data: version } = await supabase
    .from("markup_versions")
    .select(
      "id, version_number, file_url, file_name, file_size, mime_type, page_count",
    )
    .eq("markup_id", markup.id)
    .eq("is_current", true)
    .maybeSingle();

  const { data: threads } = await supabase
    .from("threads")
    .select(
      `id, thread_number, x_position, y_position, page_number, status,
       priority, created_by, guest_name, guest_email, created_at, updated_at,
       resolved_at,
       messages!messages_thread_id_fkey (
         id, content, attachments, mentions, created_by, guest_name,
         guest_email, created_at, edited_at, parent_message_id
       )`,
    )
    .eq("markup_id", markup.id)
    .order("thread_number", { ascending: true });

  const authorIds = Array.from(
    new Set([
      ...((threads ?? [])
        .map((t) => t.created_by)
        .filter(Boolean) as string[]),
      ...((threads ?? [])
        .flatMap((t) => t.messages ?? [])
        .map((m) => m.created_by)
        .filter(Boolean) as string[]),
    ]),
  );
  const { data: profiles } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", authorIds)
    : { data: [] };

  // Resolve a 1-hour signed URL for the canvas image / PDF.
  let canvasUrl: string | null = markup.thumbnail_url;
  if (version?.file_url && (markup.type === "image" || markup.type === "pdf")) {
    const { data: signed } = await supabase.storage
      .from("markup-files")
      .createSignedUrl(version.file_url, 60 * 60);
    canvasUrl = signed?.signedUrl ?? canvasUrl;
  }
  if (
    version?.file_url &&
    markup.type === "website" &&
    !version.file_url.startsWith("http")
  ) {
    const { data: signed } = await supabase.storage
      .from("screenshots")
      .createSignedUrl(version.file_url, 60 * 60);
    canvasUrl = signed?.signedUrl ?? canvasUrl;
  }

  return (
    <GuestCanvas
      shareToken={token}
      canComment={share.can_comment}
      markup={{
        id: markup.id,
        title: markup.title,
        type: markup.type,
        status: markup.status,
        source_url: markup.source_url,
        archived: markup.archived,
        canvasUrl,
      }}
      version={version ?? null}
      threads={threads ?? []}
      profiles={profiles ?? []}
    />
  );
}
