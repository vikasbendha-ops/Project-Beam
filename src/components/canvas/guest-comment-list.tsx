"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, MessageSquare, Search, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type {
  CanvasProfile,
  CanvasThread,
} from "@/components/canvas/types";

interface GuestCommentListProps {
  threads: CanvasThread[];
  profiles: Record<string, CanvasProfile>;
  onClose?: () => void;
}

/**
 * Read-only sidebar for guests. Lists every thread + first message, with
 * Active / Resolved tabs. Tapping a card activates the pin (canvas-store)
 * so the popover opens at the canvas.
 */
export function GuestCommentList({
  threads,
  profiles,
  onClose,
}: GuestCommentListProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);

  const counts = useMemo(() => {
    const active = threads.filter((t) => t.status === "open").length;
    const resolved = threads.filter((t) => t.status === "resolved").length;
    return { active, resolved };
  }, [threads]);

  const filtered = useMemo(() => {
    let xs = threads;
    if (tab === "resolved") {
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
  }, [threads, tab, search]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MessageSquare className="size-4" /> Comments
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {threads.length} {threads.length === 1 ? "thread" : "threads"}
          </p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex border-b border-border">
        {(
          [
            { id: "active" as const, label: "Active", count: counts.active },
            {
              id: "resolved" as const,
              label: "Resolved",
              count: counts.resolved,
            },
          ]
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="text-sm tabular-nums">{t.count}</span>
              <span>{t.label}</span>
              {active ? (
                <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-t-full bg-primary" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments…"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-background p-3">
        {filtered.length === 0 ? (
          <p className="px-2 py-12 text-center text-xs text-muted-foreground">
            {tab === "active"
              ? "No active threads."
              : "Nothing resolved yet."}
          </p>
        ) : (
          filtered.map((t) => {
            const first = (t.messages ?? [])[0];
            const replyCount = Math.max((t.messages?.length ?? 1) - 1, 0);
            const author =
              first?.created_by && profiles[first.created_by]
                ? profiles[first.created_by]
                : null;
            const name = author?.name ?? first?.guest_name ?? "Unknown";
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const time = t.created_at
              ? formatDistanceToNow(new Date(t.created_at), {
                  addSuffix: true,
                })
              : "";
            const isActive = activeThreadId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveThread(t.id)}
                className={cn(
                  "flex w-full flex-col gap-2 rounded-card border bg-card p-3 text-left shadow-sm transition-colors",
                  isActive
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/40",
                )}
              >
                <header className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-card",
                      t.status === "resolved"
                        ? "bg-emerald-500 text-white"
                        : "bg-primary text-primary-foreground",
                    )}
                  >
                    {t.thread_number}
                  </span>
                  <Avatar className="size-7 border border-border">
                    {author?.avatar_url ? (
                      <AvatarImage src={author.avatar_url} alt={name} />
                    ) : null}
                    <AvatarFallback className="bg-accent text-[10px] font-bold text-accent-foreground">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{time}</p>
                  </div>
                  {t.status === "resolved" ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : null}
                </header>
                <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs text-foreground">
                  {first?.content ?? <em>No messages</em>}
                </p>
                {replyCount > 0 ? (
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </p>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
