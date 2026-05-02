import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VersionHistoryView } from "@/components/canvas/version-history";
import { resolveShareToken } from "@/lib/share/resolve";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Version history · Beam",
};

interface GuestVersionsPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ asset?: string }>;
}

const ONE_DAY = 60 * 60 * 24;

export default async function GuestVersionsPage({
  params,
  searchParams,
}: GuestVersionsPageProps) {
  const { token } = await params;
  const { asset: assetParam } = await searchParams;
  const supabase = createServiceClient();
  const share = await resolveShareToken(supabase, token);
  if (!share) notFound();

  const { data: markup } = await supabase
    .from("markups")
    .select("id, title, type, workspace_id")
    .eq("id", share.markup_id)
    .maybeSingle();
  if (!markup) notFound();

  // Resolve the active asset the guest is browsing — primary by default.
  const { data: assets } = await supabase
    .from("assets")
    .select("id, position, type")
    .eq("markup_id", markup.id)
    .eq("archived", false)
    .order("position", { ascending: true });
  const activeAsset =
    (assetParam && assets?.find((a) => a.id === assetParam)) ||
    assets?.[0] ||
    null;

  const { data: rawVersions } = activeAsset
    ? await supabase
        .from("markup_versions")
        .select(
          "id, version_number, file_url, file_name, file_size, mime_type, page_count, uploaded_by, is_current, created_at",
        )
        .eq("asset_id", activeAsset.id)
        .order("version_number", { ascending: false })
    : { data: [] };
  const versions = rawVersions ?? [];

  // Sign each version's URL the same way the auth versions page does — the
  // guest needs to actually preview them.
  const activeType = activeAsset?.type ?? markup.type;
  const bucket = activeType === "website" ? "screenshots" : "markup-files";
  const versionsWithUrls = await Promise.all(
    versions.map(async (v) => {
      if (!v.file_url) return { ...v, signed_url: null };
      if (v.file_url.startsWith("http"))
        return { ...v, signed_url: v.file_url };
      const { data } = await supabase.storage
        .from(bucket)
        .createSignedUrl(v.file_url, ONE_DAY);
      return { ...v, signed_url: data?.signedUrl ?? null };
    }),
  );

  // Threads + first message preview, scoped to the active asset. When the
  // share link forbids viewing comments, hand back an empty array — the
  // view still renders versions + comparison, just without pin overlays.
  let threads: {
    id: string;
    thread_number: number;
    x_position: number | null;
    y_position: number | null;
    page_number: number | null;
    status: string;
    priority: string;
    markup_version_id: string | null;
    preview: string | null;
  }[] = [];
  if (share.can_view_comments && activeAsset) {
    const { data: rows } = await supabase
      .from("threads")
      .select(
        `id, thread_number, x_position, y_position, page_number, status,
         priority, markup_version_id, created_at,
         messages!messages_thread_id_fkey ( id, content, created_at )`,
      )
      .eq("asset_id", activeAsset.id)
      .order("thread_number", { ascending: true });
    threads = (rows ?? []).map((t) => {
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
    });
  }

  // Counts for the version list sidebar.
  const threadCountsByVersion: Record<string, number> = {};
  for (const t of threads) {
    if (t.markup_version_id) {
      threadCountsByVersion[t.markup_version_id] =
        (threadCountsByVersion[t.markup_version_id] ?? 0) + 1;
    }
  }

  // Profiles list — needed by the auth view; for guests we just pass empty
  // since we don't expose member identities beyond what threads carry.
  const profiles: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }[] = [];

  return (
    <VersionHistoryView
      mode="guest"
      shareToken={token}
      showComments={share.can_view_comments}
      workspaceId={markup.workspace_id}
      markup={{
        id: markup.id,
        title: markup.title,
        type: activeType,
      }}
      versions={versionsWithUrls}
      profiles={profiles}
      threadCountsByVersion={threadCountsByVersion}
      threads={threads}
    />
  );
}
