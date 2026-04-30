"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { CanvasTopBar } from "@/components/canvas/canvas-top-bar";
import { CommentPanel } from "@/components/canvas/comment-panel";
import { CommentBottomSheet } from "@/components/canvas/comment-bottom-sheet";
import { ImageCanvas } from "@/components/canvas/image-canvas";
import { PendingPinComposer } from "@/components/canvas/pending-pin-composer";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRealtimeCanvas } from "@/hooks/use-realtime-canvas";
import type {
  CanvasCurrentUser,
  CanvasMarkup,
  CanvasProfile,
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
  threads: CanvasThread[];
  profiles: CanvasProfile[];
  currentUser: CanvasCurrentUser;
  workspaceId: string;
}

export function CanvasViewer({
  markup,
  version,
  threads,
  profiles,
  currentUser,
  workspaceId,
}: CanvasViewerProps) {
  useRealtimeCanvas(markup.id);
  const isMobile = useIsMobile();

  const profileMap = useMemo(() => {
    const m: Record<string, CanvasProfile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);

  const isPdf = markup.type === "pdf";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <CanvasTopBar
        markup={markup}
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
          />
        ) : null}
        <main className="relative flex flex-1 items-center justify-center overflow-hidden">
          {isPdf ? (
            <PdfCanvas src={markup.canvasUrl} threads={threads} />
          ) : (
            <ImageCanvas
              src={markup.canvasUrl}
              alt={markup.title}
              threads={threads}
              pinSize={isMobile ? 32 : 28}
            />
          )}
          <PendingPinComposer
            markupId={markup.id}
            versionId={version?.id ?? null}
          />
          <ZoomControls />
        </main>
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
