"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Layers,
  Loader2,
  Plus,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  WorkspaceSwitcher,
  type WorkspaceSummary,
} from "@/components/workspace/workspace-switcher";
import {
  FolderTree,
  MARKUP_DRAG_TYPE,
  type FolderNode,
} from "@/components/workspace/folder-tree";
import { cn } from "@/lib/utils";

export interface ProjectSummary {
  id: string;
  name: string;
  color: string | null;
}

interface SidebarProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  folders?: FolderNode[];
  projects?: ProjectSummary[];
  className?: string;
}

export function Sidebar({
  current,
  workspaces,
  folders = [],
  projects = [],
  className,
}: SidebarProps) {
  const base = `/w/${current.id}`;
  const pathname = usePathname();
  const router = useRouter();
  const [allDragOver, setAllDragOver] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const filterItems: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    { href: `${base}?filter=favorites`, label: "Favorites", icon: Star },
    { href: `${base}?filter=archive`, label: "Archive", icon: Archive },
    { href: `${base}/people`, label: "People", icon: Users },
  ];

  async function moveToRoot(markupId: string) {
    const res = await fetch(`/api/markups/${markupId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folder_id: null }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't move");
      return;
    }
    toast.success("Moved out of folder");
    router.refresh();
  }

  async function createProject() {
    const name = window.prompt("Project name");
    if (!name?.trim()) return;
    setCreatingProject(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: current.id,
          name: name.trim(),
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Couldn't create project");
        return;
      }
      toast.success("Project created");
      router.refresh();
    } finally {
      setCreatingProject(false);
    }
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-muted",
        className,
      )}
    >
      <div className="border-b border-border p-3">
        <WorkspaceSwitcher current={current} workspaces={workspaces} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {/* Workspace-wide all-markups view */}
        <Link
          href={base}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (!allDragOver) setAllDragOver(true);
          }}
          onDragLeave={() => setAllDragOver(false)}
          onDrop={(e) => {
            if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
            e.preventDefault();
            setAllDragOver(false);
            const id = e.dataTransfer.getData(MARKUP_DRAG_TYPE);
            if (id) void moveToRoot(id);
          }}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === base
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
            allDragOver && "bg-accent ring-2 ring-primary",
          )}
        >
          <Layers className="size-4" strokeWidth={1.5} />
          Dashboard
        </Link>

        {/* Projects */}
        <div className="mt-3">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Projects
            </span>
            <button
              type="button"
              aria-label="New project"
              onClick={createProject}
              disabled={creatingProject}
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground disabled:opacity-50"
            >
              {creatingProject ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" strokeWidth={2} />
              )}
            </button>
          </div>
          {projects.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-muted-foreground/70">
              No projects yet.
            </p>
          ) : (
            projects.map((p) => (
              <ProjectRow
                key={p.id}
                workspaceId={current.id}
                project={p}
                folders={folders.filter(
                  (f) =>
                    (f as FolderNode & { project_id?: string }).project_id ===
                    p.id,
                )}
              />
            ))
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
          {filterItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
            >
              <item.icon className="size-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <Link
            href={`${base}/settings`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
          >
            <Settings className="size-4" strokeWidth={1.5} />
            Workspace settings
          </Link>
        </div>
      </nav>
    </aside>
  );
}

function ProjectRow({
  workspaceId,
  project,
  folders,
}: {
  workspaceId: string;
  project: ProjectSummary;
  folders: FolderNode[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const pathname = usePathname();
  const projectHref = `/w/${workspaceId}?project=${project.id}`;
  const search = pathname.includes(`/w/${workspaceId}`);
  const isActive =
    search &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("project") === project.id;

  // Drop a markup card onto a project header → set project_id + clear
  // folder_id (loose markup, lives at project root).
  async function handleDropMarkup(markupId: string) {
    const res = await fetch(`/api/markups/${markupId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        project_id: project.id,
        folder_id: null,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't move");
      return;
    }
    toast.success(`Moved to ${project.name}`);
    router.refresh();
  }

  async function newFolder() {
    const name = window.prompt(`New folder in "${project.name}"`);
    if (!name?.trim()) return;
    setCreating(true);
    const { createFolderInProject } = await import(
      "@/components/workspace/folder-tree"
    );
    const result = await createFolderInProject({
      workspaceId,
      projectId: project.id,
      parentId: null,
      name: name.trim(),
    });
    setCreating(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't create folder");
      return;
    }
    toast.success("Folder created");
    setOpen(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg px-1.5 transition-colors",
          isActive
            ? "bg-card text-primary"
            : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          dragOver && "bg-accent ring-2 ring-primary",
        )}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!dragOver) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData(MARKUP_DRAG_TYPE);
          if (id) void handleDropMarkup(id);
        }}
      >
        <button
          type="button"
          aria-label={open ? "Collapse" : "Expand"}
          onClick={() => setOpen((v) => !v)}
          className="flex size-5 items-center justify-center rounded transition-colors hover:bg-muted"
        >
          {open ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        <Link
          href={projectHref}
          className="flex flex-1 items-center gap-2 truncate py-1.5 text-sm font-semibold"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ background: project.color ?? "#6366F1" }}
          />
          <span className="truncate">{project.name}</span>
        </Link>
        <button
          type="button"
          aria-label={`New folder in ${project.name}`}
          onClick={newFolder}
          disabled={creating}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100 disabled:opacity-100"
        >
          {creating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" strokeWidth={2} />
          )}
        </button>
      </div>
      {open ? (
        <div className="ml-2 border-l border-border/50 pl-1">
          <FolderTree
            workspaceId={workspaceId}
            folders={folders}
            projectId={project.id}
            hideHeader
          />
        </div>
      ) : null}
    </div>
  );
}
