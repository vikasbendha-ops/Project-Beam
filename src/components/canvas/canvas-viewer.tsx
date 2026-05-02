"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { CanvasStateProvider, useCanvasMutators } from "@/components/canvas/canvas-state";
import { AssetRail } from "@/components/canvas/asset-rail";
import { CanvasTopBar } from "@/components/canvas/canvas-top-bar";
import { CommentPanel } from "@/components/canvas/comment-panel";
import { CommentBottomSheet } from "@/components/canvas/comment-bottom-sheet";
import { ImageCanvas } from "@/components/canvas/image-canvas";
import { PendingPinComposer } from "@/components/canvas/pending-pin-composer";
import { SiblingPreloader } from "@/components/canvas/sibling-preloader";
import { ThreadPopover } from "@/components/canvas/thread-popover";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCanvasStore } from "@/stores/canvas-store";
import { categoryFromMime } from "@/lib/mime";
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
  { ssr: false, loading: () => <CanvasLoading label="Loading PDF…" /> },
);
const OfficeCanvas = dynamic(
  () =>
    import("@/components/canvas/office-canvas").then((m) => m.OfficeCanvas),
  { ssr: false, loading: () => <CanvasLoading label="Loading document…" /> },
);
const TextCanvas = dynamic(
  () => import("@/components/canvas/text-canvas").then((m) => m.TextCanvas),
  { ssr: false, loading: () => <CanvasLoading label="Loading…" /> },
);

export interface CanvasAsset {
  id: string;
  position: number;
  title: string;
  type: string;
  thumbnail_url: string | null;
}

interface CanvasViewerProps {
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  siblings: CanvasSibling[];
  threads: CanvasThread[];
  profiles: CanvasProfile[];
  currentUser: CanvasCurrentUser;
  workspaceId: string;
  assets: CanvasAsset[];
  activeAssetId: string | null;
}

export function CanvasViewer({
  markup,
  version,
  siblings,
  threads,
  profiles,
  currentUser,
  workspaceId,
  assets,
  activeAssetId,
}: CanvasViewerProps) {
  const profileMap = useMemo(() => {
    const m: Record<string, CanvasProfile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);

  const currentName =
    profileMap[currentUser.id]?.name ?? currentUser.email ?? "You";

  return (
    <CanvasStateProvider
      markupId={markup.id}
      versionId={version?.id ?? null}
      assetId={activeAssetId}
      initialThreads={threads}
      currentUser={currentUser}
      currentUserName={currentName}
    >
      <CanvasViewerInner
        markup={markup}
        version={version}
        siblings={siblings}
        profiles={profiles}
        profileMap={profileMap}
        currentUser={currentUser}
        workspaceId={workspaceId}
        assets={assets}
        activeAssetId={activeAssetId}
      />
    </CanvasStateProvider>
  );
}

function CanvasViewerInner({
  markup,
  version,
  siblings,
  profiles,
  profileMap,
  currentUser,
  workspaceId,
  assets,
  activeAssetId,
}: {
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  siblings: CanvasSibling[];
  profiles: CanvasProfile[];
  profileMap: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
  workspaceId: string;
  assets: CanvasAsset[];
  activeAssetId: string | null;
}) {
  const isMobile = useIsMobile();
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const pendingPin = useCanvasStore((s) => s.pendingPin);
  const sidebarCollapsed = useCanvasStore((s) => s.sidebarCollapsed);
  const { threads, moveThread } = useCanvasMutators();

  const activeThread = activeThreadId
    ? threads.find((t) => t.id === activeThreadId) ?? null
    : null;

  // The DB enum buckets PDF / office / text uploads under `pdf`. Discriminate
  // the actual renderer by the version's mime_type.
  const docCategory = categoryFromMime(version?.mime_type);
  const isDocument = markup.type === "pdf";

  // Page-scoped overlay: returned children are mounted INSIDE the canvas's
  // page wrapper, so absolute %-coords resolve against that page. Used by
  // PDF (per page), and by image/office/text (always page 1).
  const renderOverlay = (page: number) => {
    const composerHere =
      pendingPin && (pendingPin.pageNumber ?? 1) === page;
    const popoverHere =
      activeThread && (activeThread.page_number ?? 1) === page;
    return (
      <>
        {composerHere ? (
          <PendingPinComposer
            markupId={markup.id}
            versionId={version?.id ?? null}
            workspaceId={workspaceId}
            members={profiles}
          />
        ) : null}
        {popoverHere ? (
          <ThreadPopover
            thread={activeThread}
            profiles={profileMap}
            currentUser={currentUser}
            workspaceId={workspaceId}
            members={profiles}
          />
        ) : null}
      </>
    );
  };

  // Fire a one-shot thumbnail capture for the first PDF page so the
  // sibling rail + dashboard cards stop showing the generic icon. Skip if
  // we've already attempted it this session (sessionStorage guard).
  const onPdfFirstRendered = (canvas: HTMLCanvasElement) => {
    const key = `beam:thumb:${markup.id}`;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key))
      return;
    if (typeof window !== "undefined") window.sessionStorage.setItem(key, "1");
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        void fetch(`/api/markups/${markup.id}/thumbnail`, {
          method: "POST",
          headers: { "content-type": "image/png" },
          body: blob,
        }).catch(() => undefined);
      },
      "image/png",
      0.85,
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <SiblingPreloader
        workspaceId={workspaceId}
        currentId={markup.id}
        siblings={siblings}
      />
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
          {isDocument && docCategory === "office" ? (
            <OfficeCanvas
              src={markup.canvasUrl}
              fileName={version?.file_name}
              threads={threads}
              renderOverlay={renderOverlay}
              onMovePin={(id, x, y, page) =>
                void moveThread(id, x, y, page ?? 1)
              }
            />
          ) : isDocument && docCategory === "text" ? (
            <TextCanvas
              src={markup.canvasUrl}
              mime={version?.mime_type}
              threads={threads}
              renderOverlay={renderOverlay}
              onMovePin={(id, x, y, page) =>
                void moveThread(id, x, y, page ?? 1)
              }
            />
          ) : isDocument ? (
            <PdfCanvas
              src={markup.canvasUrl}
              threads={threads}
              renderOverlay={renderOverlay}
              onFirstPageRendered={onPdfFirstRendered}
              onMovePin={(id, x, y, page) =>
                void moveThread(id, x, y, page ?? 1)
              }
            />
          ) : (
            <ImageCanvas
              src={markup.canvasUrl}
              alt={markup.title}
              threads={threads}
              pinSize={isMobile ? 32 : 28}
              renderOverlay={renderOverlay}
              onMovePin={(id, x, y) => void moveThread(id, x, y, 1)}
            />
          )}
          <ZoomControls />
        </main>
        {/* Right rail: ALWAYS shows assets within THIS markup. Other-markup
             siblings live in the sidebar / dashboard, never inside another
             markup's canvas. */}
        {!isMobile && assets.length > 1 ? (
          <AssetRail
            assets={assets}
            activeAssetId={activeAssetId}
            orientation="vertical"
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

function CanvasLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
