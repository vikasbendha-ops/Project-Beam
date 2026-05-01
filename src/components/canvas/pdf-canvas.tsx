"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Pin } from "@/components/canvas/pin";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasThread } from "@/components/canvas/types";
import { cn } from "@/lib/utils";

// pdf.js needs a worker URL. We bundle the matching worker from the
// installed pdfjs-dist version into /public via scripts/copy-pdf-worker.mjs
// (runs on predev / prebuild / postinstall). This avoids version-mismatch
// 404s from cdnjs/unpkg and serves the worker from the same origin.
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfCanvasProps {
  src: string | null;
  threads: CanvasThread[];
  /** Per-page overlay slot. Each call receives a 1-based page number; the
   *  returned nodes are mounted INSIDE that page's wrapper, so any
   *  absolutely-positioned children resolve their %-coords against the
   *  page. CanvasViewer uses this to mount the pending-pin composer and
   *  active thread popover on the correct page. */
  renderOverlay?: (pageNumber: number) => React.ReactNode;
  /** Fires once when page 1's bitmap finishes rendering. Used to capture
   *  a thumbnail for the dashboard / sibling rail. */
  onFirstPageRendered?: (canvas: HTMLCanvasElement) => void;
  /** Drag-to-reposition handler. Receives the destination page number so
   *  pins can move between pages if released over a different one (the
   *  caller will scope this to the page where the pointer is released). */
  onMovePin?: (
    threadId: string,
    x: number,
    y: number,
    pageNumber?: number | null,
  ) => void;
}

interface PageMeta {
  pageNumber: number;
  width: number;
  height: number;
}

const PAGE_RENDER_SCALE = 1.5;

export function PdfCanvas({
  src,
  threads,
  renderOverlay,
  onFirstPageRendered,
  onMovePin,
}: PdfCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const wrapperRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    mode,
    zoom,
    panX,
    panY,
    activeThreadId,
    pendingPin,
    setPan,
    setActiveThread,
    startPin,
  } = useCanvasStore();

  // Phase 1: load the PDF + collect page metadata. We do NOT render canvases
  // here — wrappers don't exist in the DOM until setPages triggers a render.
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setError(null);
    setPages([]);
    pdfRef.current = null;

    (async () => {
      try {
        // standardFontDataUrl + cMapUrl point at /pdfjs/{standard_fonts,cmaps}/
        // copied by scripts/copy-pdf-worker.mjs. Without these, PDFs that use
        // CJK text or any of the 14 base fonts (ZapfDingbats etc.) fail to
        // render with "Cannot load system font" and "standardFontDataUrl is
        // undefined" warnings.
        const loadingTask = pdfjsLib.getDocument({
          url: src,
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
        });
        const pdf = await loadingTask.promise;
        if (cancelled) {
          await pdf.destroy().catch(() => undefined);
          return;
        }

        const metas: PageMeta[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: PAGE_RENDER_SCALE });
          metas.push({
            pageNumber: p,
            width: viewport.width,
            height: viewport.height,
          });
        }
        if (cancelled) {
          await pdf.destroy().catch(() => undefined);
          return;
        }
        pdfRef.current = pdf;
        setPages(metas);
      } catch (err) {
        if (!cancelled) {
          console.error("[pdf]", err);
          setError("Couldn't render PDF.");
        }
      }
    })();

    return () => {
      cancelled = true;
      const pdf = pdfRef.current;
      pdfRef.current = null;
      if (pdf) void pdf.destroy().catch(() => undefined);
    };
  }, [src]);

  // Phase 2: once wrappers are in the DOM, render each page into its wrapper.
  // Runs after `pages` is populated so the refs map is reliably filled.
  useEffect(() => {
    const pdf = pdfRef.current;
    if (!pdf || pages.length === 0) return;
    let cancelled = false;

    (async () => {
      for (const meta of pages) {
        const wrapper = wrapperRefs.current.get(meta.pageNumber);
        if (!wrapper || cancelled) continue;
        // Skip if we've already rendered (HMR / re-mount).
        if (wrapper.querySelector("canvas")) continue;
        try {
          const page = await pdf.getPage(meta.pageNumber);
          const viewport = page.getViewport({ scale: PAGE_RENDER_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.dataset.pageNumber = String(meta.pageNumber);
          canvas.className =
            "block w-full select-none rounded-lg shadow-card";
          canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          if (cancelled) return;
          wrapper.replaceChildren(canvas);
          if (meta.pageNumber === 1 && onFirstPageRendered) {
            try {
              onFirstPageRendered(canvas);
            } catch (cbErr) {
              console.error("[pdf] thumbnail callback failed", cbErr);
            }
          }
        } catch (err) {
          console.error(`[pdf] page ${meta.pageNumber}`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pages, onFirstPageRendered]);

  // Wheel zoom (with modifier).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const next = Math.max(0.25, Math.min(4, zoom * (1 + delta)));
      useCanvasStore.getState().setZoom(next);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom]);

  const onPageClick = useCallback(
    (e: React.MouseEvent, pageNumber: number) => {
      if (mode !== "comment") return;
      if ((e.target as HTMLElement).closest("[data-pin]")) return;
      const wrapper = e.currentTarget as HTMLDivElement;
      const rect = wrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      startPin({ x, y, pageNumber });
    },
    [mode, startPin],
  );

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        PDF not available yet.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  // Pre-create wrapper divs for each page so the async render can mount canvases.
  // We don't know page count at first paint, so we render based on the loaded
  // metas; a placeholder is shown while pages are still rendering.
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-auto bg-muted",
        mode === "comment" ? "cursor-crosshair" : "cursor-grab",
      )}
    >
      <div
        ref={stageRef}
        className="mx-auto flex max-w-3xl flex-col gap-4 p-4 origin-top"
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        }}
      >
        {pages.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center rounded-lg bg-card text-sm text-muted-foreground">
            Rendering PDF…
          </div>
        ) : null}
        {pages.map((p) => {
          const pageThreads = threads.filter(
            (t) => (t.page_number ?? 1) === p.pageNumber,
          );
          return (
            <div
              key={p.pageNumber}
              className="relative"
              onClick={(e) => onPageClick(e, p.pageNumber)}
            >
              {/* Canvas mount target — React leaves it empty; the render
                  effect imperatively mounts a <canvas> element here so
                  React's reconciler doesn't wipe the rendered bitmap. */}
              <div
                ref={(el) => {
                  if (el) wrapperRefs.current.set(p.pageNumber, el);
                  else wrapperRefs.current.delete(p.pageNumber);
                }}
                data-page-wrapper={p.pageNumber}
                className="relative"
                style={{
                  aspectRatio: `${p.width} / ${p.height}`,
                  background: "#fff",
                  borderRadius: 8,
                }}
              />
              {pageThreads.map((t) => {
                if (t.x_position == null || t.y_position == null) return null;
                return (
                  <Pin
                    key={t.id}
                    number={t.thread_number}
                    x={Number(t.x_position)}
                    y={Number(t.y_position)}
                    active={activeThreadId === t.id}
                    resolved={t.status === "resolved"}
                    priority={t.priority}
                    onClick={() => setActiveThread(t.id)}
                    onMove={
                      onMovePin
                        ? (x, y) => onMovePin(t.id, x, y, p.pageNumber)
                        : undefined
                    }
                  />
                );
              })}
              {pendingPin?.pageNumber === p.pageNumber ? (
                <div
                  data-pin
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-primary bg-primary/20"
                  style={{
                    left: `${pendingPin.x}%`,
                    top: `${pendingPin.y}%`,
                    width: 32,
                    height: 32,
                  }}
                />
              ) : null}
              {/* Page-scoped overlay: composer + active thread popover. The
                  consumer decides what to render based on the page number. */}
              {renderOverlay?.(p.pageNumber)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
