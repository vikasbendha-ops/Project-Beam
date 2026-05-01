import { notFound, redirect } from "next/navigation";
import { Sidebar } from "@/components/workspace/sidebar";
import { TopNav } from "@/components/workspace/top-nav";
import { MobileDrawer } from "@/components/workspace/mobile-drawer";
import { NewMarkupModal } from "@/components/workspace/new-markup-modal";
import { FoldersProvider } from "@/components/workspace/folders-context";
import { AppShell } from "@/components/workspace/app-shell";
import { createClient } from "@/lib/supabase/server";
import { buildFolderTree } from "@/lib/folders";
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

  const [
    { data: profile },
    { data: folderRows },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, email, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("folders")
      .select("id, name, parent_folder_id")
      .eq("workspace_id", workspace.id)
      .order("name"),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false),
  ]);

  const folders = buildFolderTree(folderRows ?? []);

  return (
    <FoldersProvider folders={folders}>
      <AppShell
        sidebar={
          <Sidebar
            current={current}
            workspaces={workspaces}
            folders={folders}
            className="hidden h-full w-full md:flex"
          />
        }
        topNav={
          <TopNav
            workspaceId={workspace.id}
            user={{
              name: profile?.name ?? user.email ?? "You",
              email: profile?.email ?? user.email ?? "",
              avatarUrl: profile?.avatar_url ?? null,
            }}
            unreadCount={unreadCount ?? 0}
          />
        }
        mobileDrawer={
          <MobileDrawer
            current={current}
            workspaces={workspaces}
            folders={folders}
          />
        }
        modals={<NewMarkupModal workspaceId={workspace.id} />}
      >
        {children}
      </AppShell>
    </FoldersProvider>
  );
}
