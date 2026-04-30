import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/workspace/sidebar";
import { TopNav } from "@/components/workspace/top-nav";
import { MobileDrawer } from "@/components/workspace/mobile-drawer";
import { NewMarkupModal } from "@/components/workspace/new-markup-modal";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceSummary } from "@/components/workspace/workspace-switcher";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Confirm caller has access to this workspace (RLS would block reads anyway,
  // but we want a clean 404 vs an empty layout).
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, is_personal")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) notFound();

  // Workspace switcher needs every workspace the user can see.
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select(
      "workspaces!inner(id, name, is_personal, owner_id)",
    )
    .eq("user_id", user.id);

  const workspaces: WorkspaceSummary[] =
    memberships?.flatMap((m) => {
      const w = m.workspaces;
      if (!w) return [];
      return [
        {
          id: w.id,
          name: w.name,
          is_personal: w.is_personal,
          initials: w.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase(),
        },
      ];
    }) ?? [];

  const current: WorkspaceSummary = {
    id: workspace.id,
    name: workspace.name,
    is_personal: workspace.is_personal,
    initials: workspace.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  };

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        current={current}
        workspaces={workspaces}
        className="hidden md:flex"
      />
      <MobileDrawer current={current} workspaces={workspaces} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          workspaceId={workspace.id}
          user={{
            name: profile?.name ?? user.email ?? "You",
            email: profile?.email ?? user.email ?? "",
            avatarUrl: profile?.avatar_url ?? null,
          }}
        />
        <main className="flex-1">{children}</main>
      </div>
      <NewMarkupModal workspaceId={workspace.id} />
    </div>
  );
}
