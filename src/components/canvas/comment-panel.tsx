"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
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
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let xs = threads;
    if (filter === "mine") {
      xs = xs.filter((t) => t.created_by === currentUser.id);
    } else if (filter === "resolved") {
      xs = xs.filter((t) => t.status === "resolved");
    } else {
      xs = xs.filter((t) => t.status === "open");
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
  }, [threads, filter, currentUser.id, search]);

  return (
    <aside
      className={cn(
        "flex h-full w-[320px] shrink-0 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="border-b border-border p-4">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Comments</h2>
            <p className="text-xs text-muted-foreground">
              {threads.length}{" "}
              {threads.length === 1 ? "thread" : "threads"}
            </p>
          </div>
          <NewThreadHint />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments…"
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="flex border-b border-border px-2 pt-2">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "mine" as const, label: "Mine" },
            { id: "resolved" as const, label: "Resolved" },
          ]
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-1 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-accent text-primary"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background p-3">
        {filtered.length === 0 ? (
          <p className="px-2 py-12 text-center text-xs text-muted-foreground">
            {filter === "all"
              ? "No open threads. Click anywhere on the canvas to drop a pin."
              : filter === "mine"
                ? "You haven't started any threads on this MarkUp."
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
      className="flex size-8 items-center justify-center rounded-full bg-accent text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      aria-label="New thread"
    >
      <Plus className="size-4" />
    </button>
  );
}
