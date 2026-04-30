import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CanvasViewer } from "@/components/canvas/canvas-viewer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Canvas · Beam",
};

interface MarkupPageProps {
  params: Promise<{ workspaceId: string; markupId: string }>;
}

export default async function MarkupCanvasPage({ params }: MarkupPageProps) {
  const { workspaceId, markupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: markup } = await supabase
    .from("markups")
    .select(
      "id, title, type, status, source_url, thumbnail_url, workspace_id, created_by, archived",
    )
    .eq("id", markupId)
    .maybeSingle();
  if (!markup || markup.workspace_id !== workspaceId) notFound();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", markup.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (member?.role ?? "guest") as
    | "owner"
    | "member"
    | "guest";

  // Current version: file_url for image/pdf, screenshot path for website.
  const { data: version } = await supabase
    .from("markup_versions")
    .select("id, version_number, file_url, file_name, mime_type, page_count")
    .eq("markup_id", markup.id)
    .eq("is_current", true)
    .maybeSingle();

  // Threads + their messages (joined, pre-sorted by thread_number).
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
      ...(threads ?? []).map((t) => t.created_by).filter(Boolean) as string[],
      ...(threads ?? [])
        .flatMap((t) => t.messages ?? [])
        .map((m) => m.created_by)
        .filter(Boolean) as string[],
    ]),
  );
  const { data: profiles } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", authorIds)
    : { data: [] };

  // Resolve a signed URL for image/pdf canvases when stored in markup-files.
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
    <CanvasViewer
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
      currentUser={{
        id: user.id,
        email: user.email ?? "",
        role,
      }}
      workspaceId={markup.workspace_id}
    />
  );
}
