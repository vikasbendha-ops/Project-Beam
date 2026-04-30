"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquarePlus,
  MousePointer2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type {
  CanvasCurrentUser,
  CanvasMarkup,
} from "@/components/canvas/types";

interface CanvasTopBarProps {
  markup: CanvasMarkup;
  workspaceId: string;
  currentUser: CanvasCurrentUser;
}

export function CanvasTopBar({
  markup,
  workspaceId,
  currentUser,
}: CanvasTopBarProps) {
  const router = useRouter();
  const mode = useCanvasStore((s) => s.mode);
  const setMode = useCanvasStore((s) => s.setMode);
  const [approving, setApproving] = useState(false);
  const canApprove = currentUser.role !== "guest";
  const isApproved = markup.status === "approved";

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

  return (
    <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-5">
      <div className="flex min-w-0 items-center gap-3">
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
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
            {markup.title}
          </h1>
          {markup.source_url ? (
            <a
              href={markup.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ExternalLink className="size-3" /> {markup.source_url}
            </a>
          ) : null}
        </div>
        <StatusPill status={markup.status} className="hidden sm:inline-flex" />
      </div>

      <div className="hidden items-center gap-1 rounded-full border border-border bg-muted p-1 md:flex">
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

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
          onClick={() => {
            void navigator.clipboard
              .writeText(window.location.href)
              .then(() => toast.success("Link copied"));
          }}
        >
          <Share2 className="size-4" />
          Share
        </Button>
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
    </header>
  );
}
