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
    .select("id, name, owner_id, is_personal, avatar_url")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, avatar_url, timezone")
    .eq("id", user.id)
    .maybeSingle();

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(
      "email_digest_frequency, markup_notifications_default, browser_push_enabled",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <SettingsView
      workspace={workspace}
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
    />
  );
}
