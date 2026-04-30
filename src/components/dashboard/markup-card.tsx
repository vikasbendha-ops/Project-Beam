"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Calendar,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/types/database";

type MarkupSummary = Database["public"]["Views"]["markup_summary"]["Row"];

interface MarkupCardProps {
  markup: MarkupSummary;
  workspaceId: string;
}

const TYPE_ICON = {
  image: ImageIcon,
  pdf: FileText,
  website: Globe,
} as const;

export function MarkupCard({ markup, workspaceId }: MarkupCardProps) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(markup.title ?? "");
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const TypeIcon = markup.type ? TYPE_ICON[markup.type] : FileText;
  const updated = markup.updated_at
    ? format(new Date(markup.updated_at), "MMM d, yyyy")
    : "—";

  async function patch(body: Record<string, unknown>, successMsg: string) {
    const res = await fetch(`/api/markups/${markup.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Update failed");
      return false;
    }
    toast.success(successMsg);
    router.refresh();
    return true;
  }

  async function handleRename() {
    if (!renameValue.trim() || renameValue.trim() === markup.title) {
      setRenameOpen(false);
      return;
    }
    setRenaming(true);
    const ok = await patch({ title: renameValue.trim() }, "Renamed");
    setRenaming(false);
    if (ok) setRenameOpen(false);
  }

  async function handleArchiveToggle() {
    await patch(
      { archived: !markup.archived },
      markup.archived ? "Restored" : "Archived",
    );
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/markups/${markup.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Delete failed");
      return;
    }
    toast.success("Deleted");
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30">
        <Link
          href={`/w/${workspaceId}/markup/${markup.id}`}
          className="flex flex-col"
        >
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {markup.thumbnail_url ? (
              <Image
                src={markup.thumbnail_url}
                alt={markup.title ?? "MarkUp thumbnail"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <TypeIcon className="size-10" strokeWidth={1.25} />
              </div>
            )}
            {markup.status ? (
              <div className="absolute left-2 top-2">
                <StatusPill status={markup.status} size="sm" />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5 p-4">
            <h3 className="truncate pr-8 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {markup.title ?? "Untitled"}
            </h3>
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3" strokeWidth={1.5} />
                {updated}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="size-3" strokeWidth={1.5} />
                {markup.thread_count ?? 0}
              </span>
            </div>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="absolute right-3 bottom-12 flex size-7 items-center justify-center rounded-md bg-card/95 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="MarkUp actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                setRenameValue(markup.title ?? "");
                setRenameOpen(true);
              }}
            >
              <PencilLine className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleArchiveToggle}>
              {markup.archived ? (
                <>
                  <ArchiveRestore className="size-4" /> Restore
                </>
              ) : (
                <>
                  <Archive className="size-4" /> Archive
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename MarkUp</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`rename-${markup.id}`}>Title</Label>
            <Input
              id={`rename-${markup.id}`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={120}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRenameOpen(false)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRename} disabled={renaming}>
              {renaming ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{markup.title}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently removes the MarkUp, all comments, threads, and
              versions. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
