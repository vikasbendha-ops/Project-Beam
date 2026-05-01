import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SettingsView } from "@/components/settings/settings-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings · Beam",
};

interface SettingsPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select(
      "id, name, owner_id, is_personal, avatar_url, plan, plan_seats, plan_renews_at",
    )
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) notFound();

  const [{ data: profile }, { data: prefs }, { count: markupCount }, { count: memberCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, avatar_url, timezone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("notification_preferences")
        .select(
          "email_digest_frequency, markup_notifications_default, browser_push_enabled",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("markups")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null),
      supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

  const plan = (workspace.plan ?? "free") as "free" | "pro" | "team";

  return (
    <SettingsView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        owner_id: workspace.owner_id,
        is_personal: workspace.is_personal,
        avatar_url: workspace.avatar_url,
        plan,
        plan_seats: workspace.plan_seats ?? 3,
        plan_renews_at: workspace.plan_renews_at ?? null,
      }}
      profile={
        profile ?? {
          id: user.id,
          name: user.email ?? "",
          email: user.email ?? "",
          avatar_url: null,
          timezone: "UTC",
        }
      }
      preferences={
        prefs ?? {
          email_digest_frequency: "realtime",
          markup_notifications_default: "all",
          browser_push_enabled: false,
        }
      }
      isOwner={workspace.owner_id === user.id}
      usage={{
        markups: markupCount ?? 0,
        members: memberCount ?? 0,
      }}
    />
  );
}
