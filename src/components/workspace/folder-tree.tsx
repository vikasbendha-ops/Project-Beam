"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FolderNode {
  id: string;
  name: string;
  parent_folder_id: string | null;
  project_id?: string | null;
  children: FolderNode[];
}

interface FolderTreeProps {
  workspaceId: string;
  folders: FolderNode[];
}

/**
 * `application/x-beam-markup` carries `<markupId>` when a card is being
 * dragged. Used by drop targets (folder rows, "All Projects").
 */
export const MARKUP_DRAG_TYPE = "application/x-beam-markup";

export function FolderTree({ workspaceId, folders }: FolderTreeProps) {
  const router = useRouter();
  const [creatingTopLevel, setCreatingTopLevel] = useState(false);

  async function createFolder(parentId: string | null) {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        name: name.trim(),
        parent_folder_id: parentId,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't create folder");
      return;
    }
    toast.success("Folder created");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-3 py-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Folders
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="New folder"
          className="size-6"
          onClick={async () => {
            setCreatingTopLevel(true);
            try {
              await createFolder(null);
            } finally {
              setCreatingTopLevel(false);
            }
          }}
          disabled={creatingTopLevel}
        >
          {creatingTopLevel ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FolderPlus className="size-3.5" strokeWidth={1.5} />
          )}
        </Button>
      </div>
      <div className="flex flex-col">
        {folders.length === 0 ? (
          <p className="px-3 py-1.5 text-xs text-muted-foreground/70">
            No folders yet.
          </p>
        ) : (
          folders.map((f) => (
            <FolderRow
              key={f.id}
              workspaceId={workspaceId}
              folder={f}
              depth={0}
              onCreateChild={createFolder}
            />
          ))
        )}
      </div>
    </div>
  );
}

function FolderRow({
  workspaceId,
  folder,
  depth,
  onCreateChild,
}: {
  workspaceId: string;
  folder: FolderNode;
  depth: number;
  onCreateChild: (parentId: string | null) => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const href = `/w/${workspaceId}/folder/${folder.id}`;
  const isActive = pathname === href;
  const [open, setOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const hasChildren = folder.children.length > 0;

  async function handleDrop(markupId: string) {
    const res = await fetch(`/api/markups/${markupId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ folder_id: folder.id }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't move");
      return;
    }
    toast.success(`Moved to ${folder.name}`);
    router.refresh();
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-lg pl-2 pr-1.5 transition-colors",
          isActive
            ? "bg-card text-primary shadow-sm"
            : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          dragOver && "bg-accent ring-2 ring-primary",
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
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
          if (!id) return;
          void handleDrop(id);
        }}
      >
        <button
          type="button"
          aria-label={open ? "Collapse" : "Expand"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex size-5 items-center justify-center rounded transition-colors hover:bg-muted",
            !hasChildren && "invisible",
          )}
        >
          {open ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        <Link
          href={href}
          className="flex flex-1 items-center gap-2 truncate py-1.5 text-sm font-medium"
        >
          <Folder
            className={cn(
              "size-4 shrink-0",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
            strokeWidth={1.5}
          />
          <span className="truncate">{folder.name}</span>
        </Link>
        <button
          type="button"
          aria-label="New subfolder"
          onClick={() => onCreateChild(folder.id)}
          className="size-5 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <FolderPlus className="size-3.5" strokeWidth={1.5} />
        </button>
      </div>
      {open && hasChildren ? (
        <div>
          {folder.children.map((c) => (
            <FolderRow
              key={c.id}
              workspaceId={workspaceId}
              folder={c}
              depth={depth + 1}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
