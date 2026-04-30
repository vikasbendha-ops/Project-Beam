"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCanvasMutators } from "@/components/canvas/canvas-state";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type {
  CanvasProfile,
  CanvasThread,
  CanvasCurrentUser,
} from "@/components/canvas/types";

interface CommentCardProps {
  thread: CanvasThread;
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
}

export function CommentCard({
  thread,
  profiles,
  currentUser,
}: CommentCardProps) {
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const isActive = activeThreadId === thread.id;
  const [working, setWorking] = useState(false);
  const { setThreadStatus, deleteThread } = useCanvasMutators();

  const firstMessage = (thread.messages ?? [])[0];
  const replyCount = Math.max((thread.messages?.length ?? 1) - 1, 0);
  const author =
    firstMessage?.created_by && profiles[firstMessage.created_by]
      ? profiles[firstMessage.created_by]
      : null;
  const authorName =
    author?.name ?? firstMessage?.guest_name ?? "Unknown";
  const initials = authorName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const timeAgo = thread.created_at
    ? formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })
    : "";
  const canManage =
    firstMessage?.created_by === currentUser.id ||
    currentUser.role === "owner";

  async function toggleResolve() {
    setWorking(true);
    await setThreadStatus(
      thread.id,
      thread.status === "resolved" ? "open" : "resolved",
    );
    setWorking(false);
  }

  async function handleDelete() {
    if (!window.confirm("Delete this thread and all replies?")) return;
    setWorking(true);
    await deleteThread(thread.id);
    if (activeThreadId === thread.id) setActiveThread(null);
    setWorking(false);
  }

  return (
    <button
      type="button"
      onClick={() => setActiveThread(thread.id)}
      className={cn(
        "group flex w-full flex-col gap-3 rounded-card border bg-card p-4 text-left shadow-card transition-colors",
        isActive
          ? "border-primary ring-1 ring-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-card",
              thread.status === "resolved"
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground",
            )}
          >
            {thread.thread_number}
          </span>
          <Avatar className="size-8 border border-border">
            {author?.avatar_url ? (
              <AvatarImage src={author.avatar_url} alt={authorName} />
            ) : null}
            <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {authorName}
            </p>
            <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            onClick={(e) => e.stopPropagation()}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Thread actions"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                void toggleResolve();
              }}
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
            </DropdownMenuItem>
            {canManage ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleDelete();
                  }}
                  disabled={working}
                >
                  <Trash2 className="size-4" /> Delete thread
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
        {firstMessage?.content ?? <em>No messages</em>}
      </p>

      {replyCount > 0 ? (
        <p className="text-[11px] font-medium text-muted-foreground">
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </p>
      ) : null}
    </button>
  );
}
