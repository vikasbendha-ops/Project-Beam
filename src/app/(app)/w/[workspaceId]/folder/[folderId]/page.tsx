import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Folder } from "lucide-react";
import { MarkupCard } from "@/components/dashboard/markup-card";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { NewMarkupButton } from "@/components/workspace/new-markup-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Folder · Beam",
};

interface FolderPageProps {
  params: Promise<{ workspaceId: string; folderId: string }>;
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { workspaceId, folderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: folder } = await supabase
    .from("folders")
    .select("id, name, workspace_id, parent_folder_id")
    .eq("id", folderId)
    .maybeSingle();
  if (!folder || folder.workspace_id !== workspaceId) notFound();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();

  const { data: markups } = await supabase
    .from("markup_summary")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("folder_id", folderId)
    .order("updated_at", { ascending: false })
    .limit(60);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Link
              href={`/w/${workspaceId}`}
              className="transition-colors hover:text-foreground"
            >
              {workspace?.name ?? "Workspace"}
            </Link>
            <ChevronRight className="size-3.5" />
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Folder className="size-3.5" /> {folder.name}
            </span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {folder.name}
          </h1>
        </div>
        <NewMarkupButton />
      </header>
      {!markups || markups.length === 0 ? (
        <DashboardEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {markups.map((m) => (
            <MarkupCard key={m.id} markup={m} workspaceId={workspaceId} />
          ))}
        </div>
      )}
    </div>
  );
}
