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
  searchParams: Promise<{ asset?: string }>;
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const { token } = await params;
  const { asset: assetParam } = await searchParams;
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

  // Resolve assets + active asset (multi-asset markups).
  const { data: assets } = await supabase
    .from("assets")
    .select("id, position, title, type, thumbnail_url, source_url")
    .eq("markup_id", markup.id)
    .eq("archived", false)
    .order("position", { ascending: true });
  const activeAsset =
    (assetParam && assets?.find((a) => a.id === assetParam)) ||
    assets?.[0] ||
    null;

  const [{ data: version }, { data: versions }] = await Promise.all([
    activeAsset
      ? supabase
          .from("markup_versions")
          .select(
            "id, version_number, file_url, file_name, file_size, mime_type, page_count",
          )
          .eq("asset_id", activeAsset.id)
          .eq("is_current", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    activeAsset
      ? supabase
          .from("markup_versions")
          .select(
            "id, version_number, file_url, file_name, file_size, mime_type, is_current, created_at",
          )
          .eq("asset_id", activeAsset.id)
          .order("version_number", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const { data: threads } = await (activeAsset
    ? supabase
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
        .eq("asset_id", activeAsset.id)
        .order("thread_number", { ascending: true })
    : Promise.resolve({ data: [] }));

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

  // Resolve a 24-hour signed URL for the active asset's current version.
  const ONE_DAY = 60 * 60 * 24;
  const activeType = activeAsset?.type ?? markup.type;
  let canvasUrl: string | null =
    activeAsset?.thumbnail_url ?? markup.thumbnail_url;
  if (version?.file_url && (activeType === "image" || activeType === "pdf")) {
    const { data: signed } = await supabase.storage
      .from("markup-files")
      .createSignedUrl(version.file_url, ONE_DAY);
    canvasUrl = signed?.signedUrl ?? canvasUrl;
  }
  if (
    version?.file_url &&
    activeType === "website" &&
    !version.file_url.startsWith("http")
  ) {
    const { data: signed } = await supabase.storage
      .from("screenshots")
      .createSignedUrl(version.file_url, ONE_DAY);
    canvasUrl = signed?.signedUrl ?? canvasUrl;
  }

  return (
    <GuestCanvas
      shareToken={token}
      canComment={share.can_comment}
      markup={{
        id: markup.id,
        title: markup.title,
        type: activeType,
        status: markup.status,
        source_url: activeAsset?.source_url ?? markup.source_url,
        archived: markup.archived,
        canvasUrl,
      }}
      version={version ?? null}
      versions={versions ?? []}
      threads={threads ?? []}
      profiles={profiles ?? []}
      assets={(assets ?? []).map((a) => ({
        id: a.id,
        position: a.position,
        title: a.title,
        type: a.type,
        thumbnail_url: a.thumbnail_url,
      }))}
      activeAssetId={activeAsset?.id ?? null}
    />
  );
}
