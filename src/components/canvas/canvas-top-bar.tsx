"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  MessageSquarePlus,
  MousePointer2,
  PanelLeft,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ShareModal } from "@/components/canvas/share-modal";
import { ShortcutsHelp } from "@/components/canvas/shortcuts-help";
import { StatusMenu } from "@/components/canvas/status-menu";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type { MarkupStatus } from "@/components/canvas/types";
import type {
  CanvasCurrentUser,
  CanvasMarkup,
  CanvasSibling,
  CanvasVersion,
} from "@/components/canvas/types";

interface CanvasTopBarProps {
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  siblings: CanvasSibling[];
  workspaceId: string;
  currentUser: CanvasCurrentUser;
}

export function CanvasTopBar({
  markup,
  version,
  siblings,
  workspaceId,
  currentUser,
}: CanvasTopBarProps) {
  const router = useRouter();
  const mode = useCanvasStore((s) => s.mode);
  const setMode = useCanvasStore((s) => s.setMode);
  const sidebarCollapsed = useCanvasStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useCanvasStore((s) => s.setSidebarCollapsed);
  const [shareOpen, setShareOpen] = useState(false);
  const canApprove = currentUser.role !== "guest";
  const canShare = currentUser.role !== "guest";

  const { idx, prev, next, total } = useMemo(() => {
    const i = siblings.findIndex((s) => s.id === markup.id);
    return {
      idx: i,
      prev: i > 0 ? siblings[i - 1] : null,
      next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
      total: siblings.length,
    };
  }, [siblings, markup.id]);

  // Wire keyboard shortcuts. Held in a ref so the StatusMenu can populate it
  // once on mount and the keydown handler always sees the latest closure.
  const setStatusRef = useRef<((s: MarkupStatus) => Promise<void>) | null>(
    null,
  );
  const prevHrefRef = useRef<string | null>(null);
  const nextHrefRef = useRef<string | null>(null);
  useEffect(() => {
    prevHrefRef.current = prev ? `/w/${workspaceId}/markup/${prev.id}` : null;
    nextHrefRef.current = next ? `/w/${workspaceId}/markup/${next.id}` : null;
  }, [prev, next, workspaceId]);

  useEffect(() => {
    if (!canApprove && !canShare) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Don't fire while user is typing in inputs/textareas/contenteditable.
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        )
          return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "c") {
        setMode("comment");
      } else if (k === "b") {
        setMode("browse");
      } else if (canApprove && k === "a") {
        void setStatusRef.current?.("approved");
      } else if (canApprove && k === "r") {
        void setStatusRef.current?.("changes_requested");
      } else if (canApprove && k === "d") {
        void setStatusRef.current?.("draft");
      } else if (canApprove && k === "y") {
        void setStatusRef.current?.("ready_for_review");
      } else if (k === "[" || k === "arrowleft") {
        if (prevHrefRef.current) router.push(prevHrefRef.current);
      } else if (k === "]" || k === "arrowright") {
        if (nextHrefRef.current) router.push(nextHrefRef.current);
      } else {
        return;
      }
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canApprove, canShare, setMode, router]);

  const sizeLabel = version?.file_size
    ? formatBytes(version.file_size)
    : null;
  const typeLabel = (() => {
    if (markup.type === "website") return "URL";
    if (version?.mime_type) {
      const ext = version.mime_type.split("/").pop()?.toUpperCase();
      return ext ?? markup.type.toUpperCase();
    }
    return markup.type.toUpperCase();
  })();

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-3 shadow-sm md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Back to dashboard"
        >
          <Link href={`/w/${workspaceId}`}>
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:inline-flex"
        >
          <PanelLeft className="size-4" />
        </Button>
        <div className="hidden min-w-0 sm:flex sm:flex-col">
          <h1 className="truncate text-sm font-semibold text-foreground">
            {markup.title}
          </h1>
          {markup.source_url ? (
            <a
              href={markup.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="size-2.5" /> {markup.source_url}
            </a>
          ) : null}
        </div>
        <StatusPill status={markup.status} className="hidden md:inline-flex" size="sm" />
      </div>

      {/* Center: file info + mode toggle + page nav */}
      <div className="hidden items-center gap-3 md:flex">
        {total > 1 ? (
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-1.5 py-1 text-[11px] font-medium text-muted-foreground">
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Previous markup"
              disabled={!prev}
            >
              {prev ? (
                <Link href={`/w/${workspaceId}/markup/${prev.id}`}>
                  <ChevronLeft className="size-3.5" />
                </Link>
              ) : (
                <span>
                  <ChevronLeft className="size-3.5" />
                </span>
              )}
            </Button>
            <span className="tabular-nums">
              {idx + 1} <span className="text-muted-foreground/70">of {total}</span>
            </span>
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label="Next markup"
              disabled={!next}
            >
              {next ? (
                <Link href={`/w/${workspaceId}/markup/${next.id}`}>
                  <ChevronRight className="size-3.5" />
                </Link>
              ) : (
                <span>
                  <ChevronRight className="size-3.5" />
                </span>
              )}
            </Button>
          </div>
        ) : null}

        <div className="flex items-center gap-1 rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("comment")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              mode === "comment"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquarePlus className="size-3.5" /> Comment
          </button>
          <button
            type="button"
            onClick={() => setMode("browse")}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              mode === "browse"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MousePointer2 className="size-3.5" /> Browse
          </button>
        </div>

        <div className="hidden items-center gap-1 text-[10px] font-semibold text-muted-foreground lg:flex">
          <span className="rounded bg-muted px-1.5 py-0.5">{typeLabel}</span>
          {sizeLabel ? (
            <span className="rounded bg-muted px-1.5 py-0.5">{sizeLabel}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {canShare ? (
          <>
            <Button
              asChild
              type="button"
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
              aria-label="Version history"
            >
              <Link href={`/w/${workspaceId}/markup/${markup.id}/versions`}>
                <History className="size-4" />
                <span className="hidden lg:inline">Versions</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" />
              Share
            </Button>
          </>
        ) : null}
        {canApprove ? (
          <StatusMenu
            markupId={markup.id}
            current={markup.status}
            onChangeRef={(fn) => {
              setStatusRef.current = fn;
            }}
          />
        ) : null}
      </div>
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        workspaceId={workspaceId}
        markupId={markup.id}
        markupTitle={markup.title}
      />
      <ShortcutsHelp canApprove={canApprove} />
    </header>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
