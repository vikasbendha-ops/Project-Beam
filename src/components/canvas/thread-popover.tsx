"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Composer } from "@/components/canvas/composer";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  CanvasCurrentUser,
  CanvasProfile,
  CanvasThread,
} from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";

interface ThreadPopoverProps {
  thread: CanvasThread;
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
}

/**
 * Floating popover that anchors next to the active pin and shows the full
 * thread inline — markup.io-style. Doesn't take over the comment list
 * sidebar.
 */
export function ThreadPopover({
  thread,
  profiles,
  currentUser,
}: ThreadPopoverProps) {
  const router = useRouter();
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const isMobile = useIsMobile();
  const [working, setWorking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest("[data-pin]")) return;
      setActiveThread(null);
    };
    // Defer to next tick so the click that activated us doesn't dismiss us.
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [setActiveThread, thread.id]);

  if (thread.x_position == null || thread.y_position == null) return null;

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

  async function handleDelete() {
    if (!window.confirm("Delete this thread and all replies?")) return;
    setWorking(true);
    const res = await fetch(`/api/threads/${thread.id}`, { method: "DELETE" });
    setWorking(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't delete");
      return;
    }
    setActiveThread(null);
    router.refresh();
  }

  const messages = thread.messages ?? [];

  // Anchor the popover so its left edge sits at the pin and it grows to the
  // right. If the pin is past the 60% horizontal mark, flip to grow left.
  const flipLeft = Number(thread.x_position) > 60;
  const flipUp = Number(thread.y_position) > 60;

  const wrapperStyle = isMobile
    ? {
        // Bottom-sheet style on phones — full-width docked panel.
        position: "fixed" as const,
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 40,
      }
    : {
        position: "absolute" as const,
        left: `${thread.x_position}%`,
        top: `${thread.y_position}%`,
        transform: `translate(${flipLeft ? "calc(-100% - 18px)" : "18px"}, ${
          flipUp ? "calc(-100% + 14px)" : "-14px"
        })`,
        zIndex: 30,
      };

  return (
    <div
      data-popover
      ref={containerRef}
      style={wrapperStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={
          isMobile
            ? "flex w-full flex-col rounded-[14px] border border-border bg-card shadow-modal"
            : "flex w-[320px] flex-col rounded-[14px] border border-border bg-card shadow-modal"
        }
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-card ${
                thread.status === "resolved"
                  ? "bg-emerald-500 text-white"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {thread.thread_number}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {thread.status === "resolved" ? "Resolved" : "Open"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={toggleResolve}
              disabled={working}
              aria-label={
                thread.status === "resolved" ? "Reopen" : "Resolve"
              }
            >
              {thread.status === "resolved" ? (
                <Circle className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Thread actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onSelect={toggleResolve} disabled={working}>
                  {thread.status === "resolved" ? (
                    <>
                      <Circle className="size-4" /> Reopen
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Resolve
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={handleDelete}
                  disabled={working}
                >
                  <Trash2 className="size-4" /> Delete thread
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setActiveThread(null)}
              aria-label="Close"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </header>

        <div className="max-h-[280px] flex-1 space-y-3 overflow-y-auto p-3">
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
            const time = m.created_at
              ? formatDistanceToNow(new Date(m.created_at), {
                  addSuffix: true,
                })
              : "";
            return (
              <article key={m.id} className="flex gap-2">
                <Avatar className="size-7 shrink-0 border border-border">
                  {author?.avatar_url ? (
                    <AvatarImage src={author.avatar_url} alt={name} />
                  ) : null}
                  <AvatarFallback className="bg-accent text-[10px] font-bold text-accent-foreground">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <header className="flex items-baseline gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {time}
                      {m.edited_at ? " · edited" : ""}
                    </span>
                  </header>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
                    {m.content}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="border-t border-border p-2">
          <Composer
            placeholder="Reply…"
            submitLabel="Send"
            onSubmit={postReply}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
