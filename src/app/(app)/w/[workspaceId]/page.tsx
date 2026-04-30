import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Workspace · Beam",
};

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
}

/**
 * Phase 2 placeholder. Real dashboard ships in Phase 3.
 */
export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, is_personal")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) notFound();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-xl rounded-[14px] border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {workspace.name}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          You&rsquo;re signed in. The dashboard, sidebar, folder tree, and upload
          flow ship in Phase 3.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/welcome"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to welcome
          </Link>
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
