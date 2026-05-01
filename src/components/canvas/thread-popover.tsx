"use client";

import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Composer } from "@/components/canvas/composer";
import { useCanvasMutators } from "@/components/canvas/canvas-state";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  CanvasCurrentUser,
  CanvasMessage,
  CanvasProfile,
  CanvasThread,
} from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";

interface ThreadPopoverProps {
  thread: CanvasThread;
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
}

export function ThreadPopover({
  thread,
  profiles,
  currentUser,
}: ThreadPopoverProps) {
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const isMobile = useIsMobile();
  const [working, setWorking] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    postReply,
    setThreadStatus,
    setThreadPriority,
    editMessage,
    deleteThread,
    deleteMessage,
  } = useCanvasMutators();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      if ((e.target as HTMLElement).closest("[data-pin]")) return;
      setActiveThread(null);
    };
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [setActiveThread, thread.id]);

  if (thread.x_position == null || thread.y_position == null) return null;

  async function reply(content: string) {
    await postReply(thread.id, content);
  }

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
    setActiveThread(null);
    setWorking(false);
  }

  const messages = thread.messages ?? [];

  const flipLeft = Number(thread.x_position) > 60;
  const flipUp = Number(thread.y_position) > 60;

  const wrapperStyle = isMobile
    ? {
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
              <DropdownMenuContent align="end" className="w-52">
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
                <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </DropdownMenuLabel>
                {(
                  ["none", "low", "medium", "high"] as const
                ).map((p) => (
                  <DropdownMenuItem
                    key={p}
                    onSelect={() => void setThreadPriority(thread.id, p)}
                    disabled={working || thread.priority === p}
                    className="capitalize"
                  >
                    <Flag
                      className={
                        p === "high"
                          ? "size-4 text-red-500"
                          : p === "medium"
                            ? "size-4 text-amber-500"
                            : p === "low"
                              ? "size-4 text-sky-500"
                              : "size-4 text-muted-foreground"
                      }
                      fill={p !== "none" ? "currentColor" : "none"}
                      strokeWidth={p === "none" ? 1.5 : 0}
                    />
                    {p === "none" ? "No priority" : `${p}`}
                    {thread.priority === p ? (
                      <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        ✓
                      </span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
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
          {messages.map((m) => (
            <MessageItem
              key={m.id}
              message={m}
              profile={
                m.created_by && profiles[m.created_by]
                  ? profiles[m.created_by]
                  : null
              }
              isOwn={
                m.created_by != null && m.created_by === currentUser.id
              }
              onEdit={(content) => editMessage(thread.id, m.id, content)}
              onDelete={() => void deleteMessage(thread.id, m.id)}
            />
          ))}
        </div>

        <div className="border-t border-border p-2">
          <Composer
            placeholder="Reply…"
            submitLabel="Send"
            onSubmit={reply}
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}

function MessageItem({
  message: m,
  profile,
  isOwn,
  onEdit,
  onDelete,
}: {
  message: CanvasMessage;
  profile: CanvasProfile | null;
  isOwn: boolean;
  onEdit: (content: string) => void | Promise<void>;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(m.content);
  const [hover, setHover] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(m.content);
      // Focus + place caret at end on next tick.
      const t = setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.selectionStart = el.value.length;
          el.selectionEnd = el.value.length;
        }
      }, 20);
      return () => clearTimeout(t);
    }
  }, [editing, m.content]);

  const name = profile?.name ?? m.guest_name ?? "Unknown";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const time = m.created_at
    ? formatDistanceToNow(new Date(m.created_at), { addSuffix: true })
    : "";
  const isPending =
    typeof m.id === "string" && m.id.startsWith("tmp_");

  async function save() {
    const next = draft.trim();
    if (!next || next === m.content.trim()) {
      setEditing(false);
      return;
    }
    await onEdit(next);
    setEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setEditing(false);
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void save();
    }
  }

  return (
    <article
      className={`group/msg flex gap-2 ${isPending ? "opacity-60" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Avatar className="size-7 shrink-0 border border-border">
        {profile?.avatar_url ? (
          <AvatarImage src={profile.avatar_url} alt={name} />
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
            {isPending ? "Sending…" : time}
            {m.edited_at ? " · edited" : ""}
          </span>
          {isOwn && !editing && hover && !isPending ? (
            <span className="ml-auto inline-flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Edit message"
              >
                <Pencil className="size-3" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                aria-label="Delete message"
              >
                <Trash2 className="size-3" />
              </button>
            </span>
          ) : null}
        </header>
        {editing ? (
          <div className="mt-1">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={Math.min(8, Math.max(2, draft.split("\n").length + 1))}
              maxLength={4000}
              className="w-full resize-y rounded-md border border-primary bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                className="h-7 px-2 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void save()}
                disabled={!draft.trim() || draft.trim() === m.content.trim()}
                className="h-7 px-2 text-xs"
              >
                Save
              </Button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground/80">
              ⌘/Ctrl + Enter to save · Esc to cancel
            </p>
          </div>
        ) : (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-foreground">
            {m.content}
          </p>
        )}
      </div>
    </article>
  );
}
