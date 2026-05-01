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

const ONE_DAY = 60 * 60 * 24;

export default async function MarkupCanvasPage({ params }: MarkupPageProps) {
  const { workspaceId, markupId } = await params;
  const supabase = await createClient();

  // Phase 1: auth + the markup row in parallel.
  const [
    {
      data: { user },
    },
    { data: markup },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("markups")
      .select(
        "id, title, type, status, source_url, thumbnail_url, workspace_id, folder_id, created_by, archived",
      )
      .eq("id", markupId)
      .maybeSingle(),
  ]);

  if (!user) redirect("/login");
  if (!markup || markup.workspace_id !== workspaceId) notFound();

  // Phase 2: every dependent query in parallel — they only need markup +
  // user, never each other.
  const siblingsBuilder = supabase
    .from("markups")
    .select("id, title, type, thumbnail_url, archived, status")
    .eq("workspace_id", workspaceId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  const [
    { data: member },
    { data: version },
    { data: threads },
    { data: siblings },
  ] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", markup.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("markup_versions")
      .select(
        "id, version_number, file_url, file_name, file_size, mime_type, page_count",
      )
      .eq("markup_id", markup.id)
      .eq("is_current", true)
      .maybeSingle(),
    supabase
      .from("threads")
      .select(
        `id, thread_number, x_position, y_position, page_number, status,
         priority, created_by, guest_name, guest_email, created_at, updated_at,
         resolved_at,
         messages!messages_thread_id_fkey (
           id, content, attachments, mentions, reactions, created_by, guest_name,
           guest_email, created_at, edited_at, parent_message_id
         )`,
      )
      .eq("markup_id", markup.id)
      .order("thread_number", { ascending: true }),
    markup.folder_id !== null && markup.folder_id !== undefined
      ? siblingsBuilder.eq("folder_id", markup.folder_id)
      : siblingsBuilder.is("folder_id", null),
  ]);

  const role = (member?.role ?? "guest") as "owner" | "member" | "guest";

  // Phase 3: things that need phase-2 results — profiles (need authors)
  // and the signed canvas URL (needs version.file_url). Run in parallel.
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

  const profilesPromise = authorIds.length
    ? supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", authorIds)
    : Promise.resolve({ data: [] as { id: string; name: string; email: string; avatar_url: string | null }[] });

  // Sign the canvas URL only when the version actually points at storage.
  // For website markups using full http URLs, skip signing.
  const signPromise: Promise<{ data: { signedUrl: string } | null }> =
    (() => {
      if (
        version?.file_url &&
        (markup.type === "image" || markup.type === "pdf")
      ) {
        return supabase.storage
          .from("markup-files")
          .createSignedUrl(version.file_url, ONE_DAY) as unknown as Promise<{
          data: { signedUrl: string } | null;
        }>;
      }
      if (
        version?.file_url &&
        markup.type === "website" &&
        !version.file_url.startsWith("http")
      ) {
        return supabase.storage
          .from("screenshots")
          .createSignedUrl(version.file_url, ONE_DAY) as unknown as Promise<{
          data: { signedUrl: string } | null;
        }>;
      }
      return Promise.resolve({ data: null });
    })();

  // Sign the next + previous siblings' canvas URLs too so the client can
  // preload them — switching pages becomes instant.
  const idx = (siblings ?? []).findIndex((s) => s.id === markup.id);
  const nextSibling = idx >= 0 ? (siblings ?? [])[idx + 1] : undefined;
  const prevSibling = idx > 0 ? (siblings ?? [])[idx - 1] : undefined;

  const [{ data: profiles }, { data: signed }] = await Promise.all([
    profilesPromise,
    signPromise,
  ]);

  const canvasUrl =
    signed?.signedUrl ?? markup.thumbnail_url ?? null;

  // Sibling preloads are fire-and-forget; they don't block render.
  // We resolve them via thumbnail_url which is already a long-lived signed
  // URL stored on the markup row (set when the screenshot was persisted).
  const preloadUrls = [prevSibling?.thumbnail_url, nextSibling?.thumbnail_url]
    .filter(Boolean) as string[];

  return (
    <>
      {preloadUrls.map((url) => (
        // <link rel="preload"> warms the HTTP cache so the next/prev nav
        // renders the image instantly. Browsers de-duplicate identical
        // preloads.
        <link
          key={url}
          rel="preload"
          as="image"
          href={url}
          // eslint-disable-next-line react/no-unknown-property
          fetchPriority="low"
        />
      ))}
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
        siblings={siblings ?? []}
        threads={threads ?? []}
        profiles={profiles ?? []}
        currentUser={{
          id: user.id,
          email: user.email ?? "",
          role,
        }}
        workspaceId={markup.workspace_id}
      />
    </>
  );
}
