"use client";

import { useMemo, useState } from "react";
import { ListFilter, MessageSquare, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { CommentCard } from "@/components/canvas/comment-card";
import type {
  CanvasCurrentUser,
  CanvasProfile,
  CanvasThread,
} from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface CommentPanelProps {
  threads: CanvasThread[];
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
  markupId: string;
  className?: string;
}

export function CommentPanel({
  threads,
  profiles,
  currentUser,
  className,
}: CommentPanelProps) {
  const filter = useCanvasStore((s) => s.filter);
  const setFilter = useCanvasStore((s) => s.setFilter);
  const collapsed = useCanvasStore((s) => s.sidebarCollapsed);
  const setCollapsed = useCanvasStore((s) => s.setSidebarCollapsed);
  const [search, setSearch] = useState("");
  const [showMine, setShowMine] = useState(false);

  const counts = useMemo(() => {
    const active = threads.filter((t) => t.status === "open").length;
    const resolved = threads.filter((t) => t.status === "resolved").length;
    return { active, resolved };
  }, [threads]);

  const filtered = useMemo(() => {
    let xs = threads;
    if (filter === "resolved") {
      xs = xs.filter((t) => t.status === "resolved");
    } else {
      xs = xs.filter((t) => t.status === "open");
    }
    if (showMine || filter === "mine") {
      xs = xs.filter((t) => t.created_by === currentUser.id);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      xs = xs.filter((t) =>
        (t.messages ?? []).some((m) =>
          (m.content ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return xs;
  }, [threads, filter, currentUser.id, search, showMine]);

  // Collapsed (icon-strip) mode
  if (collapsed) {
    return (
      <aside
        className={cn(
          "flex h-full w-9 shrink-0 flex-col items-center gap-3 border-r border-border bg-card py-3",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Expand comments"
        >
          <MessageSquare className="size-4" />
        </button>
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {counts.active}
        </span>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[320px] shrink-0 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="flex border-b border-border">
        {(
          [
            {
              id: "active" as const,
              label: "Active",
              count: counts.active,
            },
            {
              id: "resolved" as const,
              label: "Resolved",
              count: counts.resolved,
            },
          ]
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-bold transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-sm tabular-nums">{tab.count}</span>
              <span>{tab.label}</span>
              {active ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-t-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        <button
          type="button"
          onClick={() => setShowMine((v) => !v)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
            showMine
              ? "bg-accent text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-pressed={showMine}
          title="Filter to threads you started"
        >
          <ListFilter className="size-3" /> Mine
        </button>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-7 pl-7 text-xs"
          />
        </div>
        <NewThreadHint />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background p-3">
        {filtered.length === 0 ? (
          <p className="px-2 py-12 text-center text-xs text-muted-foreground">
            {filter === "active"
              ? "No active threads. Click anywhere on the canvas to drop a pin."
              : "No resolved threads yet."}
          </p>
        ) : (
          filtered.map((t) => (
            <CommentCard
              key={t.id}
              thread={t}
              profiles={profiles}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </aside>
  );
}

function NewThreadHint() {
  return (
    <button
      type="button"
      onClick={() =>
        toast.message("Click anywhere on the canvas to drop a pin.")
      }
      className="flex size-7 items-center justify-center rounded-full bg-accent text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      aria-label="New thread"
    >
      <Plus className="size-3.5" />
    </button>
  );
}
