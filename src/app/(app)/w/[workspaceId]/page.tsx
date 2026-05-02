import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MarkupGrid } from "@/components/dashboard/markup-grid";
import { DashboardEmptyState } from "@/components/dashboard/empty-state";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { NewMarkupButton } from "@/components/workspace/new-markup-button";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Markups · Beam",
};

type MarkupStatus = Database["public"]["Enums"]["markup_status"];

const STATUS_VALUES: ReadonlyArray<MarkupStatus> = [
  "draft",
  "ready_for_review",
  "changes_requested",
  "approved",
];

interface WorkspacePageProps {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{
    status?: string;
    q?: string;
    sort?: string;
    project?: string;
  }>;
}

const SORT_KEYS = ["updated", "created", "comments", "review"] as const;
type SortKey = (typeof SORT_KEYS)[number];

export default async function WorkspaceDashboard({
  params,
  searchParams,
}: WorkspacePageProps) {
  const { workspaceId } = await params;
  const sp = await searchParams;
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

  const statusFilter =
    sp.status && (STATUS_VALUES as readonly string[]).includes(sp.status)
      ? (sp.status as MarkupStatus)
      : null;
  const queryFilter = (sp.q ?? "").trim();
  const sortKey: SortKey =
    sp.sort && (SORT_KEYS as readonly string[]).includes(sp.sort)
      ? (sp.sort as SortKey)
      : "updated";

  // Project filter: ?project=<id> narrows to one project; otherwise show
  // all markups across the workspace (the "All MarkUps" view).
  const projectFilter = sp.project ?? null;
  // When a project is selected, show only top-level markups inside it
  // (folders break the list out into sub-pages). Without a project filter,
  // show all top-level markups workspace-wide.
  let query = supabase
    .from("markup_summary")
    .select("*")
    .eq("workspace_id", workspace.id)
    .is("folder_id", null)
    .limit(60);
  if (projectFilter) query = query.eq("project_id", projectFilter);
  if (sortKey === "comments") {
    query = query
      .order("thread_count", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false });
  } else if (sortKey === "created") {
    query = query.order("created_at", { ascending: false });
  } else if (sortKey === "review") {
    // Awaiting review = Ready or Changes requested first, then by updated_at.
    // Implemented client-side via two queries would be wasteful; instead,
    // we sort updated_at desc and the UI always surfaces those statuses
    // via the filter pills. To honour the sort intent, narrow to those
    // statuses unless an explicit status filter overrides.
    if (!statusFilter) {
      query = query.in("status", ["ready_for_review", "changes_requested"]);
    }
    query = query.order("updated_at", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }
  if (statusFilter) query = query.eq("status", statusFilter);
  if (queryFilter) {
    // Match against title or source_url, case-insensitive.
    const escaped = queryFilter.replace(/[%_,]/g, (c) => `\\${c}`);
    query = query.or(
      `title.ilike.%${escaped}%,source_url.ilike.%${escaped}%`,
    );
  }
  const { data: markups } = await query;

  // Count by status across the whole root (ignores filters) so the pills
  // show useful totals regardless of what the user has selected.
  const { data: countRows } = await supabase
    .from("markup_summary")
    .select("status")
    .eq("workspace_id", workspace.id)
    .is("folder_id", null);
  const counts: Partial<Record<MarkupStatus | "all", number>> = {
    all: countRows?.length ?? 0,
  };
  for (const row of countRows ?? []) {
    if (row.status) {
      counts[row.status as MarkupStatus] =
        (counts[row.status as MarkupStatus] ?? 0) + 1;
    }
  }

  const isFiltered = Boolean(statusFilter) || Boolean(queryFilter);

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{workspace.name}</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">
              {projectFilter ? "Project" : "All MarkUps"}
            </span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {projectFilter ? "MarkUps" : "All MarkUps"}
          </h1>
        </div>
        <NewMarkupButton />
      </header>

      <div className="mb-6">
        <DashboardFilters counts={counts} />
      </div>

      {!markups || markups.length === 0 ? (
        isFiltered ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
            <p className="text-sm font-semibold text-foreground">
              No matching MarkUps
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different status or clear the search.
            </p>
          </div>
        ) : (
          <DashboardEmptyState />
        )
      ) : (
        <MarkupGrid markups={markups} workspaceId={workspace.id} />
      )}
    </div>
  );
}
