"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  FolderInput,
  Globe,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  PencilLine,
  Trash2,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatusPill } from "@/components/dashboard/status-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL } from "@/lib/constants";
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
import { MARKUP_DRAG_TYPE } from "@/components/workspace/folder-tree";
import { useFolders } from "@/components/workspace/folders-context";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type MarkupSummary = Database["public"]["Views"]["markup_summary"]["Row"];
type MarkupStatus = Database["public"]["Enums"]["markup_status"];

const STATUS_ICON: Record<MarkupStatus, typeof Check> = {
  draft: PencilLine,
  ready_for_review: Clock,
  changes_requested: XCircle,
  approved: CheckCircle2,
};
const STATUS_ICON_COLOR: Record<MarkupStatus, string> = {
  draft: "text-muted-foreground",
  ready_for_review: "text-sky-600",
  changes_requested: "text-amber-600",
  approved: "text-emerald-600",
};
const STATUS_ORDER: MarkupStatus[] = [
  "draft",
  "ready_for_review",
  "changes_requested",
  "approved",
];

interface MarkupCardProps {
  markup: MarkupSummary;
  workspaceId: string;
  /** When `selectionMode` is true, the checkbox is always visible. When
   *  false, it appears only on hover. Either way, clicking it fires
   *  `onToggleSelect`. The card link is suppressed in selection mode so
   *  bulk-edit clicks don't accidentally navigate. */
  selected?: boolean;
  selectionMode?: boolean;
  onToggleSelect?: (e: React.MouseEvent) => void;
}

const TYPE_ICON = {
  image: ImageIcon,
  pdf: FileText,
  website: Globe,
} as const;

export function MarkupCard({
  markup,
  workspaceId,
  selected = false,
  selectionMode = false,
  onToggleSelect,
}: MarkupCardProps) {
  const router = useRouter();
  const { flat: foldersFlat } = useFolders();
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(markup.title ?? "");
  const [renaming, setRenaming] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const TypeIcon = markup.type ? TYPE_ICON[markup.type] : FileText;
  const updated = markup.updated_at
    ? format(new Date(markup.updated_at), "MMM d, yyyy")
    : "—";

  const targetFolders = useMemo(
    () => foldersFlat.filter((f) => f.id !== markup.folder_id),
    [foldersFlat, markup.folder_id],
  );

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

  async function handleStatus(status: MarkupStatus) {
    if (markup.status === status) return;
    await patch({ status }, `Status: ${STATUS_LABEL[status]}`);
  }

  async function handleMove(folderId: string | null, label: string) {
    setMoving(true);
    const ok = await patch({ folder_id: folderId }, `Moved to ${label}`);
    setMoving(false);
    if (ok) setMoveOpen(false);
  }

  return (
    <>
      <div
        draggable={!selectionMode}
        onDragStart={(e) => {
          if (!markup.id || selectionMode) return;
          e.dataTransfer.setData(MARKUP_DRAG_TYPE, markup.id);
          e.dataTransfer.effectAllowed = "move";
          setDragging(true);
        }}
        onDragEnd={() => setDragging(false)}
        className={cn(
          "group relative flex flex-col rounded-xl border bg-card transition-all",
          selected
            ? "border-primary ring-2 ring-primary/30"
            : "border-border hover:border-primary/30",
          dragging && "scale-[0.98] opacity-50",
        )}
      >
        {/* Selection checkbox — visible always in selection mode, on
            hover otherwise. Clicking suppresses link navigation. */}
        {onToggleSelect ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect(e);
            }}
            aria-label={selected ? "Deselect" : "Select"}
            className={cn(
              "absolute left-3 top-3 z-20 flex size-5 items-center justify-center rounded-md border-2 transition-all",
              selected
                ? "border-primary bg-primary text-primary-foreground opacity-100"
                : "border-border bg-card/95 text-transparent opacity-0 backdrop-blur group-hover:opacity-100",
              selectionMode && !selected && "opacity-100",
            )}
          >
            {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
          </button>
        ) : null}
        <Link
          href={selectionMode ? "#" : `/w/${workspaceId}/markup/${markup.id}`}
          className="flex flex-col overflow-hidden rounded-xl"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          onClick={(e) => {
            // In selection mode, clicking the card body toggles selection
            // instead of navigating, so bulk operations stay intuitive.
            if (selectionMode && onToggleSelect) {
              e.preventDefault();
              onToggleSelect(e);
            }
          }}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-muted">
            {markup.thumbnail_url ? (
              <Image
                src={markup.thumbnail_url}
                alt={markup.title ?? "MarkUp thumbnail"}
                fill
                className="pointer-events-none object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
                draggable={false}
              />
            ) : markup.type === "website" ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
                <Globe className="size-10 animate-pulse" strokeWidth={1.25} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  Rendering screenshot…
                </span>
              </div>
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
              <CommentHeat count={markup.thread_count ?? 0} />
            </div>
          </div>
        </Link>
        <HoverPreview markup={markup} updated={updated} TypeIcon={TypeIcon} />

        <DropdownMenu>
          <DropdownMenuTrigger
            className="absolute right-3 bottom-12 flex size-7 items-center justify-center rounded-md bg-card/95 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary group-hover:opacity-100 data-[state=open]:opacity-100"
            aria-label="MarkUp actions"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </DropdownMenuLabel>
            {STATUS_ORDER.map((s) => {
              const Icon = STATUS_ICON[s];
              const active = markup.status === s;
              return (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => handleStatus(s)}
                  className={cn(active && "bg-muted/50 font-semibold")}
                >
                  <Icon className={cn("size-4", STATUS_ICON_COLOR[s])} />
                  <span className="flex-1">{STATUS_LABEL[s]}</span>
                  {active ? (
                    <Check className="size-4 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setRenameValue(markup.title ?? "");
                setRenameOpen(true);
              }}
            >
              <PencilLine className="size-4" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
              <FolderInput className="size-4" /> Move to…
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

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move &ldquo;{markup.title}&rdquo;</DialogTitle>
            <DialogDescription>
              Pick a destination. You can also drag the card onto a folder
              in the sidebar.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-[320px] overflow-y-auto rounded-lg border border-border">
            <FolderRow
              label="All Projects"
              hint="Workspace root (no folder)"
              isCurrent={!markup.folder_id}
              disabled={moving || !markup.folder_id}
              onSelect={() => handleMove(null, "All Projects")}
            />
            {targetFolders.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground">
                No other folders in this workspace yet.
              </li>
            ) : (
              targetFolders.map((f) => (
                <FolderRow
                  key={f.id}
                  label={f.path}
                  isCurrent={false}
                  depth={f.depth}
                  disabled={moving}
                  onSelect={() => handleMove(f.id, f.name)}
                />
              ))
            )}
          </ul>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMoveOpen(false)}
              disabled={moving}
            >
              Cancel
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

/**
 * Comment activity heat dot. Visual signal for how active a markup is —
 * gray (none), sky (1-4), amber pulse (5+).
 */
function CommentHeat({ count }: { count: number }) {
  const tone =
    count === 0
      ? "bg-muted-foreground/30"
      : count <= 4
        ? "bg-sky-500"
        : "bg-amber-500 animate-pulse";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("size-1.5 rounded-full", tone)}
        aria-hidden
      />
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="size-3" strokeWidth={1.5} />
        {count}
      </span>
    </span>
  );
}

/**
 * Hover-preview panel. Bigger thumbnail + status + counts. Appears
 * under the card with a 300ms hover delay; positioned absolute so it
 * floats above neighbouring cards.
 */
function HoverPreview({
  markup,
  updated,
  TypeIcon,
}: {
  markup: MarkupSummary;
  updated: string;
  TypeIcon: typeof FileText;
}) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-[260px] -translate-x-1/2 rounded-[14px] border border-border bg-card opacity-0 shadow-modal transition-opacity duration-200 [transition-delay:300ms]",
        "group-hover:opacity-100 group-hover:[transition-delay:300ms]",
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-[14px] bg-muted">
        {markup.thumbnail_url ? (
          <Image
            src={markup.thumbnail_url}
            alt=""
            fill
            sizes="260px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <TypeIcon className="size-8" strokeWidth={1.25} />
          </div>
        )}
        {markup.status ? (
          <div className="absolute right-2 top-2">
            <StatusPill status={markup.status} size="sm" />
          </div>
        ) : null}
      </div>
      <div className="space-y-1.5 p-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {markup.title ?? "Untitled"}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
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
    </div>
  );
}

function FolderRow({
  label,
  hint,
  isCurrent,
  depth = 0,
  disabled,
  onSelect,
}: {
  label: string;
  hint?: string;
  isCurrent: boolean;
  depth?: number;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled || isCurrent}
        style={{ paddingLeft: 16 + depth * 14 }}
        className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex-1 truncate">
          {label}
          {hint ? (
            <span className="ml-2 text-[11px] text-muted-foreground">
              {hint}
            </span>
          ) : null}
        </span>
        {isCurrent ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <Check className="size-3" /> here
          </span>
        ) : disabled ? (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        ) : null}
      </button>
    </li>
  );
}
