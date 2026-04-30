import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications · Beam",
};

interface NotificationsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { workspaceId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) notFound();

  const { data: notifications } = await supabase
    .from("notifications")
    .select(
      "id, user_id, type, workspace_id, markup_id, thread_id, message_id, triggered_by, triggered_by_guest_name, content_preview, read, read_at, created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const triggererIds = Array.from(
    new Set(
      (notifications ?? [])
        .map((n) => n.triggered_by)
        .filter(Boolean) as string[],
    ),
  );
  const markupIds = Array.from(
    new Set(
      (notifications ?? [])
        .map((n) => n.markup_id)
        .filter(Boolean) as string[],
    ),
  );

  const [{ data: profiles }, { data: markups }] = await Promise.all([
    triggererIds.length
      ? supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", triggererIds)
      : Promise.resolve({ data: [] as { id: string; name: string; avatar_url: string | null }[] }),
    markupIds.length
      ? supabase.from("markups").select("id, title").in("id", markupIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  return (
    <NotificationCenter
      notifications={notifications ?? []}
      profiles={profiles ?? []}
      markups={markups ?? []}
      workspaceId={workspaceId}
    />
  );
}
