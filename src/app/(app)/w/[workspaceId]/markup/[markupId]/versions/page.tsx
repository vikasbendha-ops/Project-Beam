import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { VersionHistoryView } from "@/components/canvas/version-history";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Version history · Beam",
};

interface VersionsPageProps {
  params: Promise<{ workspaceId: string; markupId: string }>;
}

const ONE_DAY = 60 * 60 * 24;

export default async function VersionsPage({ params }: VersionsPageProps) {
  const { workspaceId, markupId } = await params;
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

  const { data: versions } = await supabase
    .from("markup_versions")
    .select(
      "id, version_number, file_url, file_name, file_size, mime_type, page_count, uploaded_by, is_current, created_at",
    )
    .eq("markup_id", markupId)
    .order("version_number", { ascending: false });

  // Pre-sign each version's file URL so the preview pane can render the
  // actual document — not just metadata. 24h TTL = browser cache hits across
  // selections + page reloads. Website screenshots already store an https://
  // URL in `file_url` (Supabase `screenshots` bucket signed by the Apify
  // webhook); skip re-signing those.
  const bucket = markup.type === "website" ? "screenshots" : "markup-files";
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

  const { data: threadCounts } = await supabase
    .from("threads")
    .select("markup_version_id")
    .eq("markup_id", markupId);

  return (
    <VersionHistoryView
      markup={{ id: markup.id, title: markup.title, type: markup.type }}
      workspaceId={workspaceId}
      versions={versionsWithUrls}
      profiles={profiles ?? []}
      threadCountsByVersion={(threadCounts ?? []).reduce<
        Record<string, number>
      >((acc, t) => {
        if (t.markup_version_id) {
          acc[t.markup_version_id] = (acc[t.markup_version_id] ?? 0) + 1;
        }
        return acc;
      }, {})}
    />
  );
}
