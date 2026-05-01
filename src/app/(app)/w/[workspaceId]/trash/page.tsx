import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TrashView } from "@/components/dashboard/trash-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Trash · Beam",
};

interface TrashPageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function TrashPage({ params }: TrashPageProps) {
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

  const { data: rows } = await supabase
    .from("markups")
    .select(
      "id, title, type, thumbnail_url, deleted_at, created_at, status",
    )
    .eq("workspace_id", workspaceId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return <TrashView workspace={workspace} items={rows ?? []} />;
}
