"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { CanvasTopBar } from "@/components/canvas/canvas-top-bar";
import { CommentPanel } from "@/components/canvas/comment-panel";
import { CommentBottomSheet } from "@/components/canvas/comment-bottom-sheet";
import { ImageCanvas } from "@/components/canvas/image-canvas";
import { MarkupRail } from "@/components/canvas/markup-rail";
import { PendingPinComposer } from "@/components/canvas/pending-pin-composer";
import { ThreadPopover } from "@/components/canvas/thread-popover";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeCanvas } from "@/hooks/use-realtime-canvas";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";
import type {
  CanvasCurrentUser,
  CanvasMarkup,
  CanvasProfile,
  CanvasSibling,
  CanvasThread,
  CanvasVersion,
} from "@/components/canvas/types";

const PdfCanvas = dynamic(
  () => import("@/components/canvas/pdf-canvas").then((m) => m.PdfCanvas),
  { ssr: false, loading: () => <CanvasLoading /> },
);

interface CanvasViewerProps {
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  siblings: CanvasSibling[];
  threads: CanvasThread[];
  profiles: CanvasProfile[];
  currentUser: CanvasCurrentUser;
  workspaceId: string;
}

export function CanvasViewer({
  markup,
  version,
  siblings,
  threads,
  profiles,
  currentUser,
  workspaceId,
}: CanvasViewerProps) {
  useRealtimeCanvas(markup.id);
  const isMobile = useIsMobile();
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const sidebarCollapsed = useCanvasStore((s) => s.sidebarCollapsed);

  const profileMap = useMemo(() => {
    const m: Record<string, CanvasProfile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);

  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId) ?? null
    : null;

  const isPdf = markup.type === "pdf";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <CanvasTopBar
        markup={markup}
        version={version}
        siblings={siblings}
        workspaceId={workspaceId}
        currentUser={currentUser}
      />
      <div className="flex flex-1 overflow-hidden">
        {!isMobile ? (
          <CommentPanel
            threads={threads}
            profiles={profileMap}
            currentUser={currentUser}
            markupId={markup.id}
            className={cn(
              "transition-[width] duration-200",
              sidebarCollapsed && "w-9",
            )}
          />
        ) : null}
        <main className="relative flex flex-1 overflow-hidden">
          {isPdf ? (
            <PdfCanvas src={markup.canvasUrl} threads={threads} />
          ) : (
            <ImageCanvas
              src={markup.canvasUrl}
              alt={markup.title}
              threads={threads}
              pinSize={isMobile ? 32 : 28}
              renderOverlay={() =>
                activeThread ? (
                  <ThreadPopover
                    thread={activeThread}
                    profiles={profileMap}
                    currentUser={currentUser}
                  />
                ) : null
              }
            />
          )}
          <PendingPinComposer
            markupId={markup.id}
            versionId={version?.id ?? null}
          />
          <ZoomControls />
        </main>
        {!isMobile ? (
          <MarkupRail
            workspaceId={workspaceId}
            siblings={siblings}
            currentId={markup.id}
          />
        ) : null}
      </div>
      {isMobile ? (
        <CommentBottomSheet
          threads={threads}
          profiles={profileMap}
          currentUser={currentUser}
          markupId={markup.id}
        />
      ) : null}
    </div>
  );
}

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading PDF…</div>
    </div>
  );
}
