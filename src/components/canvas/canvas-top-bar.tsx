"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Loader2,
  MessageSquarePlus,
  MousePointer2,
  PanelLeft,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ShareModal } from "@/components/canvas/share-modal";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
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
  const [approving, setApproving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const canApprove = currentUser.role !== "guest";
  const canShare = currentUser.role !== "guest";
  const isApproved = markup.status === "approved";

  const { idx, prev, next, total } = useMemo(() => {
    const i = siblings.findIndex((s) => s.id === markup.id);
    return {
      idx: i,
      prev: i > 0 ? siblings[i - 1] : null,
      next: i >= 0 && i < siblings.length - 1 ? siblings[i + 1] : null,
      total: siblings.length,
    };
  }, [siblings, markup.id]);

  async function toggleApprove() {
    setApproving(true);
    const res = await fetch(`/api/markups/${markup.id}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approved: !isApproved }),
    });
    setApproving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Approval failed");
      return;
    }
    toast.success(isApproved ? "Reopened for review" : "Approved");
    router.refresh();
  }

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
          <Button
            type="button"
            size="sm"
            onClick={toggleApprove}
            disabled={approving}
            variant={isApproved ? "outline" : "default"}
          >
            {approving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {isApproved ? "Reopen" : "Approve"}
          </Button>
        ) : null}
      </div>
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        workspaceId={workspaceId}
        markupId={markup.id}
        markupTitle={markup.title}
      />
    </header>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
