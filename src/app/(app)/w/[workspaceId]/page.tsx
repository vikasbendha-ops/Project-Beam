import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MarkupCard } from "@/components/dashboard/markup-card";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { NewMarkupButton } from "@/components/workspace/new-markup-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Markups · Beam",
};

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function WorkspaceDashboard({
  params,
}: WorkspacePageProps) {
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

  // Top-level markups (folder_id is null) for this workspace.
  // Use the markup_summary view so we get comment counts etc.
  const { data: markups } = await supabase
    .from("markup_summary")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("folder_id", null)
    .order("updated_at", { ascending: false })
    .limit(60);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{workspace.name}</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">All Projects</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Markups
          </h1>
        </div>
        <NewMarkupButton />
      </header>

      {!markups || markups.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markups.map((m) => (
            <MarkupCard key={m.id} markup={m} workspaceId={workspace.id} />
          ))}
        </div>
      )}
    </div>
  );
}
