"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Archive, FolderOpen, Settings, Star, Users } from "lucide-react";
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

interface SidebarProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  folders?: FolderNode[];
  className?: string;
}

export function Sidebar({
  current,
  workspaces,
  folders = [],
  className,
}: SidebarProps) {
  const base = `/w/${current.id}`;
  const pathname = usePathname();
  const router = useRouter();
  const [allProjectsDragOver, setAllProjectsDragOver] = useState(false);

  const items: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    exact: boolean;
    droppableFolderId?: string | null;
  }[] = [
    {
      href: base,
      label: "All Projects",
      icon: FolderOpen,
      exact: true,
      droppableFolderId: null,
    },
    {
      href: `${base}?filter=shared`,
      label: "Shared with me",
      icon: Users,
      exact: false,
    },
    {
      href: `${base}?filter=favorites`,
      label: "Favorites",
      icon: Star,
      exact: false,
    },
    {
      href: `${base}?filter=archive`,
      label: "Archive",
      icon: Archive,
      exact: false,
    },
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
    toast.success("Moved to All Projects");
    router.refresh();
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
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href.split("?")[0]
            : false;
          const isAllProjects = item.label === "All Projects";
          const isDroppable = item.droppableFolderId === null;

          return (
            <Link
              key={item.label}
              href={item.href}
              onDragOver={(e) => {
                if (!isDroppable) return;
                if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (isAllProjects && !allProjectsDragOver) setAllProjectsDragOver(true);
              }}
              onDragLeave={() =>
                isAllProjects && setAllProjectsDragOver(false)
              }
              onDrop={(e) => {
                if (!isDroppable) return;
                if (!e.dataTransfer.types.includes(MARKUP_DRAG_TYPE)) return;
                e.preventDefault();
                if (isAllProjects) setAllProjectsDragOver(false);
                const id = e.dataTransfer.getData(MARKUP_DRAG_TYPE);
                if (id) void moveToRoot(id);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                allProjectsDragOver &&
                  isAllProjects &&
                  "bg-accent ring-2 ring-primary",
              )}
            >
              <item.icon
                className={cn(
                  "size-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-3 border-t border-border pt-3">
          <FolderTree workspaceId={current.id} folders={folders} />
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
