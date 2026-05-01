"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  FolderInput,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MarkupCard } from "@/components/dashboard/markup-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/components/workspace/folders-context";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type MarkupSummary = Database["public"]["Views"]["markup_summary"]["Row"];

interface MarkupGridProps {
  markups: MarkupSummary[];
  workspaceId: string;
}

/**
 * Dashboard grid with multi-select. Click a card normally to open it;
 * click the hovered checkbox (or any checkbox once one is set) to toggle
 * selection. Shift+click on a checkbox extends the range from the last
 * selected to the clicked card in current render order.
 *
 * When ≥1 are selected, a floating action bar appears at the bottom of
 * the viewport with Archive / Move / Delete + a Clear button. Esc clears.
 */
export function MarkupGrid({ markups, workspaceId }: MarkupGridProps) {
  const router = useRouter();
  const { flat: foldersFlat } = useFolders();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "archive" | "delete" | "move">(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const ids = useMemo(
    () => markups.map((m) => m.id).filter(Boolean) as string[],
    [markups],
  );

  // Esc clears selection.
  useEffect(() => {
    if (selected.size === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setSelected(new Set());
        setLastClickedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected.size]);

  function toggle(id: string, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedId && lastClickedId !== id) {
        const a = ids.indexOf(lastClickedId);
        const b = ids.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [from, to] = a < b ? [a, b] : [b, a];
          // Decide whether to add or remove based on the clicked card's
          // current state: if it's currently selected, the user is
          // shrinking the range; otherwise expanding.
          const adding = !prev.has(id);
          for (let i = from; i <= to; i++) {
            if (adding) next.add(ids[i]);
            else next.delete(ids[i]);
          }
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastClickedId(id);
  }

  function selectAll() {
    setSelected(new Set(ids));
  }
  function clear() {
    setSelected(new Set());
    setLastClickedId(null);
  }

  async function bulkPatch(
    body: Record<string, unknown>,
    label: string,
  ): Promise<boolean> {
    const arr = Array.from(selected);
    const results = await Promise.allSettled(
      arr.map((id) =>
        fetch(`/api/markups/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }).then((r) => (r.ok ? null : r.json())),
      ),
    );
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value),
    ).length;
    if (failed === arr.length) {
      toast.error(`${label} failed`);
      return false;
    }
    if (failed > 0)
      toast.warning(
        `${arr.length - failed} ${label.toLowerCase()}, ${failed} failed`,
      );
    else toast.success(`${arr.length} ${label.toLowerCase()}`);
    return true;
  }

  async function bulkArchive() {
    setBusy("archive");
    // If ALL selected are already archived, this acts as restore.
    const allArchived = Array.from(selected).every(
      (id) => markups.find((m) => m.id === id)?.archived,
    );
    const ok = await bulkPatch(
      { archived: !allArchived },
      allArchived ? "Restored" : "Archived",
    );
    setBusy(null);
    if (ok) {
      clear();
      router.refresh();
    }
  }

  async function bulkMove(folderId: string | null, label: string) {
    setBusy("move");
    const ok = await bulkPatch({ folder_id: folderId }, `Moved to ${label}`);
    setBusy(null);
    if (ok) {
      clear();
      setMoveOpen(false);
      router.refresh();
    }
  }

  async function bulkDelete() {
    setBusy("delete");
    const arr = Array.from(selected);
    const results = await Promise.allSettled(
      arr.map((id) =>
        fetch(`/api/markups/${id}`, { method: "DELETE" }).then((r) =>
          r.ok ? null : r.json(),
        ),
      ),
    );
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && r.value),
    ).length;
    setBusy(null);
    if (failed === arr.length) {
      toast.error("Delete failed");
      return;
    }
    toast.success(`${arr.length - failed} moved to trash`);
    setDeleteOpen(false);
    clear();
    router.refresh();
  }

  const allArchived =
    selected.size > 0 &&
    Array.from(selected).every(
      (id) => markups.find((m) => m.id === id)?.archived,
    );

  return (
    <>
      <PullToRefreshIndicator onRefresh={() => router.refresh()} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {markups.map((m) => {
          if (!m.id) return null;
          const isSel = selected.has(m.id);
          return (
            <MarkupCard
              key={m.id}
              markup={m}
              workspaceId={workspaceId}
              selected={isSel}
              selectionMode={selected.size > 0}
              onToggleSelect={(e) => toggle(m.id!, e.shiftKey)}
            />
          );
        })}
      </div>

      {/* Floating action bar */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-all duration-200",
          selected.size === 0
            ? "translate-y-4 opacity-0"
            : "translate-y-0 opacity-100",
        )}
      >
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-modal",
          )}
        >
          <span className="ml-1 text-xs font-semibold tabular-nums text-foreground">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={selected.size === ids.length ? clear : selectAll}
            className="ml-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {selected.size === ids.length ? "Clear" : "Select all"}
          </button>
          <span className="h-5 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={bulkArchive}
            disabled={busy !== null}
          >
            {busy === "archive" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : allArchived ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
            {allArchived ? "Restore" : "Archive"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMoveOpen(true)}
            disabled={busy !== null}
          >
            <FolderInput className="size-4" />
            Move
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            disabled={busy !== null}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
          <span className="h-5 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            aria-label="Clear selection"
            className="size-8"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Move dialog */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Move {selected.size} MarkUps</DialogTitle>
            <DialogDescription>Pick a destination folder.</DialogDescription>
          </DialogHeader>
          <ul className="max-h-[320px] overflow-y-auto rounded-lg border border-border">
            <li>
              <button
                type="button"
                onClick={() => bulkMove(null, "All Projects")}
                disabled={busy !== null}
                className="flex w-full items-center gap-2 border-b border-border px-4 py-2.5 text-left text-sm hover:bg-muted/50 disabled:opacity-60"
              >
                <span className="flex-1 truncate">All Projects</span>
                <span className="text-[11px] text-muted-foreground">
                  Workspace root
                </span>
              </button>
            </li>
            {foldersFlat.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground">
                No folders in this workspace yet.
              </li>
            ) : (
              foldersFlat.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => bulkMove(f.id, f.name)}
                    disabled={busy !== null}
                    style={{ paddingLeft: 16 + f.depth * 14 }}
                    className="flex w-full items-center gap-2 border-b border-border py-2.5 pr-4 text-left text-sm last:border-b-0 hover:bg-muted/50 disabled:opacity-60"
                  >
                    <span className="flex-1 truncate">{f.path}</span>
                    {busy === "move" ? (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setMoveOpen(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} MarkUps?</DialogTitle>
            <DialogDescription>
              This permanently removes every selected MarkUp, plus all their
              comments, threads, and versions. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={busy === "delete"}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={bulkDelete}
              disabled={busy === "delete"}
            >
              {busy === "delete" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete {selected.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PullToRefreshIndicator({
  onRefresh,
}: {
  onRefresh: () => Promise<void> | void;
}) {
  const { pulling, progress } = usePullToRefresh(onRefresh);
  if (!pulling && progress === 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center transition-transform"
      style={{
        transform: `translateY(${Math.min(40, progress * 40)}px)`,
        opacity: progress,
      }}
    >
      <div className="flex size-9 items-center justify-center rounded-full border border-border bg-card shadow-md">
        <Loader2
          className={cn(
            "size-4 text-primary",
            progress >= 1 ? "animate-spin" : "",
          )}
          style={{
            transform: `rotate(${progress * 360}deg)`,
          }}
        />
      </div>
    </div>
  );
}

