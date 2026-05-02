import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VersionHistoryView } from "@/components/canvas/version-history";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Version history · Beam",
};

interface VersionsPageProps {
  params: Promise<{ workspaceId: string; markupId: string }>;
  searchParams: Promise<{ asset?: string }>;
}

const ONE_DAY = 60 * 60 * 24;

export default async function VersionsPage({
  params,
  searchParams,
}: VersionsPageProps) {
  const { workspaceId, markupId } = await params;
  const { asset: assetParam } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: markup } = await supabase
    .from("markups")
    .select("id, title, type, status, source_url, archived, workspace_id")
    .eq("id", markupId)
    .maybeSingle();
  if (!markup || markup.workspace_id !== workspaceId) notFound();

  // Resolve active asset (multi-asset markups). Default = primary.
  const { data: assets } = await supabase
    .from("assets")
    .select("id, position, title, type, thumbnail_url")
    .eq("markup_id", markupId)
    .eq("archived", false)
    .order("position", { ascending: true });
  const activeAsset =
    (assetParam && assets?.find((a) => a.id === assetParam)) ||
    assets?.[0] ||
    null;

  const versionsQuery = supabase
    .from("markup_versions")
    .select(
      "id, version_number, file_url, file_name, file_size, mime_type, page_count, uploaded_by, is_current, created_at, asset_id",
    )
    .eq("markup_id", markupId)
    .order("version_number", { ascending: false });
  const { data: versions } = activeAsset
    ? await versionsQuery.eq("asset_id", activeAsset.id)
    : await versionsQuery;

  // Pre-sign each version's file URL so the preview pane can render the
  // actual document — not just metadata. 24h TTL = browser cache hits across
  // selections + page reloads. Website screenshots already store an https://
  // URL in `file_url` (Supabase `screenshots` bucket signed by the Apify
  // webhook); skip re-signing those.
  const activeType = activeAsset?.type ?? markup.type;
  const bucket = activeType === "website" ? "screenshots" : "markup-files";
  const versionsWithUrls = await Promise.all(
    (versions ?? []).map(async (v) => {
      if (!v.file_url) return { ...v, signed_url: null };
      if (v.file_url.startsWith("http")) {
        return { ...v, signed_url: v.file_url };
      }
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(v.file_url, ONE_DAY);
      return { ...v, signed_url: data?.signedUrl ?? null };
    }),
  );

  const uploaderIds = Array.from(
    new Set(
      (versions ?? []).map((v) => v.uploaded_by).filter(Boolean) as string[],
    ),
  );
  const { data: profiles } = uploaderIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", uploaderIds)
    : { data: [] };

  // Full thread positions per version — needed by compare view to overlay
  // both versions' pins on each pane. Scope to the ACTIVE ASSET only —
  // pins from a different asset aren't relevant in this version-history
  // view.
  const threadsQuery = supabase
    .from("threads")
    .select(
      `id, thread_number, x_position, y_position, page_number, status,
       priority, markup_version_id, created_at,
       messages!messages_thread_id_fkey ( id, content, created_at )`,
    )
    .eq("markup_id", markupId)
    .order("thread_number", { ascending: true });
  const { data: threadRows } = activeAsset
    ? await threadsQuery.eq("asset_id", activeAsset.id)
    : await threadsQuery;

  const threadCountsByVersion = (threadRows ?? []).reduce<
    Record<string, number>
  >((acc, t) => {
    if (t.markup_version_id) {
      acc[t.markup_version_id] = (acc[t.markup_version_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <VersionHistoryView
      markup={{ id: markup.id, title: markup.title, type: markup.type }}
      workspaceId={workspaceId}
      versions={versionsWithUrls}
      profiles={profiles ?? []}
      threadCountsByVersion={threadCountsByVersion}
      threads={(threadRows ?? []).map((t) => {
        const firstMsg = (t.messages ?? [])[0];
        return {
          id: t.id,
          thread_number: t.thread_number,
          x_position: t.x_position,
          y_position: t.y_position,
          page_number: t.page_number,
          status: t.status,
          priority: t.priority,
          markup_version_id: t.markup_version_id,
          preview: firstMsg?.content ?? null,
        };
      })}
    />
  );
}
