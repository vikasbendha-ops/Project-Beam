import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PeopleView } from "@/components/people/people-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "People · Beam",
};

interface PeoplePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function PeoplePage({ params }: PeoplePageProps) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, owner_id, is_personal")
    .eq("id", workspaceId)
    .maybeSingle();
  if (!workspace) notFound();

  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id, role, joined_at")
    .eq("workspace_id", workspaceId);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", userIds)
    : { data: [] as { id: string; name: string; email: string; avatar_url: string | null }[] };

  const { data: invites } = await supabase
    .from("workspace_invites")
    .select("id, email, role, expires_at, accepted_at, created_at, invited_by")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const profileMap = (profiles ?? []).reduce<
    Record<string, { id: string; name: string; email: string; avatar_url: string | null }>
  >((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});

  return (
    <PeopleView
      workspace={{
        id: workspace.id,
        name: workspace.name,
        owner_id: workspace.owner_id,
        is_personal: workspace.is_personal,
      }}
      members={(members ?? []).map((m) => ({
        ...m,
        profile: profileMap[m.user_id] ?? null,
      }))}
      invites={invites ?? []}
      currentUserId={user.id}
    />
  );
}
