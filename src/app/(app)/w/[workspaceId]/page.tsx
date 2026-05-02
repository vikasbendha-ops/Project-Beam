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
    filter?: string;
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
  // EVERY markup workspace-wide (Dashboard view = no folder/project gate).
  const projectFilter = sp.project ?? null;
  const filterMode = sp.filter ?? null; // favorites | archive | shared
  let query = supabase
    .from("markup_summary")
    .select("*")
    .eq("workspace_id", workspace.id)
    .limit(120);
  if (projectFilter) query = query.eq("project_id", projectFilter);
  if (filterMode === "favorites") query = query.eq("favorite", true);
  if (filterMode === "archive") query = query.eq("archived", true);
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

  // Status counts mirror the same scope as the list (workspace-wide, with
  // optional project narrowing). Ignore the user's status pill so totals
  // stay stable as they switch filters.
  let countQ = supabase
    .from("markup_summary")
    .select("status")
    .eq("workspace_id", workspace.id);
  if (projectFilter) countQ = countQ.eq("project_id", projectFilter);
  const { data: countRows } = await countQ;
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

  // Project view metadata: name + folders so we can group markups by folder
  // when the user clicks a project. Cheap two-query addition; both run only
  // when `projectFilter` is set.
  let projectMeta: { id: string; name: string; color: string | null } | null =
    null;
  let projectFolders: { id: string; name: string }[] = [];
  if (projectFilter) {
    const { data: p } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("id", projectFilter)
      .maybeSingle();
    projectMeta = p
      ? { id: p.id, name: p.name, color: p.color ?? null }
      : null;
    const { data: fs } = await supabase
      .from("folders")
      .select("id, name")
      .eq("workspace_id", workspace.id)
      .eq("project_id", projectFilter)
      .order("name", { ascending: true });
    projectFolders = fs ?? [];
  }

  // Group markups by folder for the project view.
  type ProjectGroup = {
    key: string;
    title: string;
    folderId: string | null;
    rows: typeof markups;
  };
  const projectGroups: ProjectGroup[] = [];
  if (projectFilter && markups) {
    const byFolder = new Map<string | null, typeof markups>();
    for (const m of markups) {
      const k = m.folder_id ?? null;
      if (!byFolder.has(k)) byFolder.set(k, []);
      byFolder.get(k)!.push(m);
    }
    // Push folder groups in folder-name order.
    for (const f of projectFolders) {
      const rows = byFolder.get(f.id) ?? [];
      projectGroups.push({
        key: f.id,
        title: f.name,
        folderId: f.id,
        rows,
      });
    }
    // Then orphans last.
    const orphans = byFolder.get(null) ?? [];
    if (orphans.length > 0 || projectFolders.length === 0) {
      projectGroups.push({
        key: "__none__",
        title: "Out of folder",
        folderId: null,
        rows: orphans,
      });
    }
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{workspace.name}</span>
            <ChevronRight className="size-3.5" />
            <span className="text-foreground">
              {projectMeta?.name ?? (projectFilter ? "Project" : "Dashboard")}
            </span>
          </nav>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {filterMode === "favorites"
              ? "Favorites"
              : filterMode === "archive"
                ? "Archive"
                : projectMeta ? (
                  <>
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded-full"
                      style={{ background: projectMeta.color ?? "#6366F1" }}
                    />
                    {projectMeta.name}
                  </>
                ) : (
                  "Dashboard"
                )}
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
      ) : projectFilter ? (
        <div className="flex flex-col gap-10">
          {projectGroups.map((g) => (
            <section key={g.key}>
              <header className="mb-3 flex items-baseline gap-2">
                <h2 className="text-base font-semibold text-foreground">
                  {g.folderId === null ? (
                    <span className="text-muted-foreground">{g.title}</span>
                  ) : (
                    g.title
                  )}
                </h2>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {g.rows?.length ?? 0}
                </span>
              </header>
              {!g.rows || g.rows.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-xs text-muted-foreground">
                  Empty
                </div>
              ) : (
                <MarkupGrid markups={g.rows} workspaceId={workspace.id} />
              )}
            </section>
          ))}
        </div>
      ) : (
        <MarkupGrid markups={markups} workspaceId={workspace.id} />
      )}
    </div>
  );
}
