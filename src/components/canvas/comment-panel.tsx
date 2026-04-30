"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommentCard } from "@/components/canvas/comment-card";
import { Composer } from "@/components/canvas/composer";
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
  markupId,
  className,
}: CommentPanelProps) {
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
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

  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId) ?? null
    : null;

  if (activeThread) {
    return (
      <ThreadDetail
        thread={activeThread}
        profiles={profiles}
        currentUser={currentUser}
        className={className}
      />
    );
  }

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
          <NewThreadButton />
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

function NewThreadButton() {
  const startPin = useCanvasStore((s) => s.startPin);
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

function ThreadDetail({
  thread,
  profiles,
  currentUser,
  className,
}: {
  thread: CanvasThread;
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
  className?: string;
}) {
  const router = useRouter();
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const [working, setWorking] = useState(false);

  async function postReply(content: string) {
    const res = await fetch(`/api/threads/${thread.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error ?? "Couldn't post");
    }
    router.refresh();
  }

  async function toggleResolve() {
    setWorking(true);
    const res = await fetch(`/api/threads/${thread.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: thread.status === "resolved" ? "open" : "resolved",
      }),
    });
    setWorking(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't update");
      return;
    }
    router.refresh();
  }

  const messages = thread.messages ?? [];

  return (
    <aside
      className={cn(
        "flex h-full w-[320px] shrink-0 flex-col border-r border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setActiveThread(null)}
          aria-label="Back to all threads"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Thread #{thread.thread_number}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {thread.status === "resolved" ? "Resolved" : "Open"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleResolve}
          disabled={working}
        >
          {thread.status === "resolved" ? (
            <>
              <Circle className="size-4" /> Reopen
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" /> Resolve
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-background p-4">
        {messages.map((m) => {
          const author =
            m.created_by && profiles[m.created_by]
              ? profiles[m.created_by]
              : null;
          const name = author?.name ?? m.guest_name ?? "Unknown";
          const initials = name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const timeAgo = m.created_at
            ? formatDistanceToNow(new Date(m.created_at), {
                addSuffix: true,
              })
            : "";

          return (
            <article
              key={m.id}
              className="rounded-card border border-border bg-card p-3 shadow-sm"
            >
              <header className="mb-2 flex items-center gap-2.5">
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
                  <p className="text-[10px] text-muted-foreground">
                    {timeAgo}
                    {m.edited_at ? " · edited" : ""}
                  </p>
                </div>
              </header>
              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                {m.content}
              </p>
            </article>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <Composer
          placeholder="Reply…"
          submitLabel="Send"
          onSubmit={postReply}
          autoFocus
        />
      </div>
    </aside>
  );
}
