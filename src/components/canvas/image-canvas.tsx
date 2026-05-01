"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pin } from "@/components/canvas/pin";
import { PinCluster } from "@/components/canvas/pin-cluster";
import type { CanvasThread } from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface ClusterShape {
  id: string;
  x: number;
  y: number;
  count: number;
  unresolved: number;
  firstThreadId: string;
}

interface ImageCanvasProps {
  src: string | null;
  alt?: string;
  threads: CanvasThread[];
  pinSize?: number;
  /** Render-prop for popover content (active thread + pending pin composer).
   *  Receives the page number so the same prop can be reused by PDF (which
   *  renders one overlay per page). For images, always called with 1. */
  renderOverlay?: (pageNumber: number) => React.ReactNode;
  /** When provided, pins become draggable. Receives the new % coords on
   *  release. The 4th arg is page number (always 1 for images). */
  onMovePin?: (
    threadId: string,
    x: number,
    y: number,
    pageNumber?: number | null,
  ) => void;
}

/**
 * markup.io-style image canvas.
 *
 * - **fit-width** (default): image fills container width, vertical scroll.
 * - **fit-height**: image fills container height, horizontal scroll.
 * - **actual**: zoom is freeform (1 = native px), centered on cursor.
 *
 * Pin coordinates are stored as percentages of the image's intrinsic
 * dimensions, so they survive any zoom or fit mode.
 *
 * Interactions:
 *   - Click empty area in `comment` mode → drop pending pin.
 *   - Click pin → activate thread (popover).
 *   - Trackpad two-finger scroll / mouse wheel → scroll canvas.
 *   - Cmd/Ctrl + wheel → zoom centered on cursor.
 *   - Hold Space + drag, or middle-button drag → pan.
 */
export function ImageCanvas({
  src,
  alt = "Canvas",
  threads,
  pinSize = 28,
  renderOverlay,
  onMovePin,
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  const {
    mode,
    fit,
    zoom,
    spaceHeld,
    activeThreadId,
    pendingPin,
    hidePins,
    setZoom,
    setSpaceHeld,
    setActiveThread,
    startPin,
  } = useCanvasStore();

  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  // Cluster pins when the user has zoomed out enough that individual pins
  // would visually overlap. We bucket by 8% × 8% grid cells; any cell with
  // 2+ pins becomes a cluster bubble. Threshold + cell size are tuned so
  // pins stay individual at the default fit-width view.
  const setZoomSmooth = useCanvasStore((s) => s.setZoomSmooth);
  const clustering = fit === "actual" && zoom < 0.55 && threads.length > 5;
  const { soloPins, clusters } = useMemo(() => {
    if (!clustering) {
      return { soloPins: threads, clusters: [] as ClusterShape[] };
    }
    const cellSize = 8;
    const buckets = new Map<string, CanvasThread[]>();
    for (const t of threads) {
      if (t.x_position == null || t.y_position == null) continue;
      const cx = Math.floor(Number(t.x_position) / cellSize);
      const cy = Math.floor(Number(t.y_position) / cellSize);
      const key = `${cx}-${cy}`;
      const bucket = buckets.get(key) ?? [];
      bucket.push(t);
      buckets.set(key, bucket);
    }
    const solo: CanvasThread[] = [];
    const groups: ClusterShape[] = [];
    for (const bucket of buckets.values()) {
      if (bucket.length === 1) {
        solo.push(bucket[0]);
      } else {
        const ax =
          bucket.reduce((s, t) => s + Number(t.x_position ?? 0), 0) /
          bucket.length;
        const ay =
          bucket.reduce((s, t) => s + Number(t.y_position ?? 0), 0) /
          bucket.length;
        groups.push({
          id: bucket.map((t) => t.id).join("|"),
          x: ax,
          y: ay,
          count: bucket.length,
          unresolved: bucket.filter((t) => t.status !== "resolved").length,
          firstThreadId: bucket[0].id,
        });
      }
    }
    return { soloPins: solo, clusters: groups };
  }, [threads, clustering]);

  // Track Space-key state globally so users can pan over pins/composer.
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setSpaceHeld(true);
      }
      if (e.key === "Escape") {
        setActiveThread(null);
        startPin(null);
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [setSpaceHeld, setActiveThread, startPin]);

  // Cursor-centered wheel zoom.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: WheelEvent) => {
      // ctrlKey is true for both Ctrl/Cmd+scroll and trackpad pinch on Mac.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left + el.scrollLeft;
      const cursorY = e.clientY - rect.top + el.scrollTop;

      const factor = Math.exp(-e.deltaY * 0.0015);
      const prev = zoom;
      const next = Math.max(0.25, Math.min(4, prev * factor));
      if (next === prev) return;

      // Adjust scroll so the point under the cursor stays under the cursor.
      const ratio = next / prev;
      const newCursorX = cursorX * ratio;
      const newCursorY = cursorY * ratio;
      setZoom(next);

      // Schedule scroll adjust after the new size paints. Two RAFs to be
      // safe — first fires before the layout commit, second after.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.scrollLeft = newCursorX - (e.clientX - rect.left);
          el.scrollTop = newCursorY - (e.clientY - rect.top);
        });
      });
    };

    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, setZoom]);

  // Touch pinch-zoom: two fingers spread/pinch zoom around the midpoint, with
  // 2-finger drag panning. Single-finger touches fall through to native scroll
  // so users can still scroll a zoomed-in image with one finger.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startDist = 0;
    let startZoom = zoom;
    let startMid = { x: 0, y: 0 };
    let startScroll = { x: 0, y: 0 };

    function dist(t1: Touch, t2: Touch) {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.hypot(dx, dy);
    }
    function mid(t1: Touch, t2: Touch) {
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 2 || !el) return;
      e.preventDefault();
      startDist = dist(e.touches[0], e.touches[1]);
      startZoom = zoom;
      const m = mid(e.touches[0], e.touches[1]);
      const rect = el.getBoundingClientRect();
      startMid = { x: m.x - rect.left, y: m.y - rect.top };
      startScroll = { x: el.scrollLeft, y: el.scrollTop };
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length !== 2 || !el) return;
      e.preventDefault();
      const d = dist(e.touches[0], e.touches[1]);
      if (startDist === 0) return;
      const factor = d / startDist;
      const next = Math.max(0.25, Math.min(4, startZoom * factor));
      if (next === zoom) return;
      const ratio = next / zoom;
      const cursorX = startMid.x + startScroll.x;
      const cursorY = startMid.y + startScroll.y;
      const newCursorX = cursorX * ratio;
      const newCursorY = cursorY * ratio;
      setZoom(next);
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollLeft = newCursorX - startMid.x;
        el.scrollTop = newCursorY - startMid.y;
      });
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [zoom, setZoom]);

  // Hold-Space or middle-mouse to pan. We pan by adjusting the container's
  // scrollLeft / scrollTop so it composes with the native scroll behaviour
  // (no transforms, no jank).
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const isPan = e.button === 1 || (e.button === 0 && spaceHeld);
      if (!isPan) return;
      const el = containerRef.current;
      if (!el) return;
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      };
    },
    [spaceHeld],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const el = containerRef.current;
      if (!drag || !el) return;
      el.scrollLeft = drag.scrollLeft - (e.clientX - drag.startX);
      el.scrollTop = drag.scrollTop - (e.clientY - drag.startY);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't drop if user was panning, in browse mode, or holding space.
      if (mode !== "comment") return;
      if (spaceHeld) return;
      if (dragRef.current) return;
      if ((e.target as HTMLElement).closest("[data-pin],[data-popover]")) {
        return;
      }
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      setActiveThread(null);
      startPin({ x, y });
    },
    [mode, spaceHeld, setActiveThread, startPin],
  );

  // Compute the image style based on fit mode. For fit-width / fit-height
  // we set width/height in CSS and let the browser handle aspect; for
  // actual we use the intrinsic size * zoom.
  const imageStyle: React.CSSProperties = (() => {
    if (!imgSize) return { maxWidth: "100%" };
    if (fit === "fit-width") return { width: "100%", height: "auto" };
    if (fit === "fit-height") return { height: "100%", width: "auto" };
    return {
      width: `${imgSize.w * zoom}px`,
      height: `${imgSize.h * zoom}px`,
    };
  })();

  const cursor = (() => {
    if (dragRef.current) return "grabbing";
    if (spaceHeld) return "grab";
    if (mode === "comment") return "crosshair";
    return "default";
  })();

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      className={cn(
        "relative h-full w-full overflow-auto bg-muted",
        // Hide native scrollbar arrows on macOS; keep functional bars.
      )}
      style={{ cursor }}
    >
      <div
        ref={stageRef}
        onClick={onCanvasClick}
        className="relative mx-auto"
        style={{
          width: imageStyle.width,
          height: imageStyle.height,
          minHeight: fit === "fit-height" ? "100%" : undefined,
          minWidth: fit === "fit-width" ? "100%" : undefined,
        }}
      >
        {src ? (
          <>
            {!imgSize ? (
              <div
                aria-hidden="true"
                className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-card to-muted/60"
                style={{ minHeight: "70vh" }}
              />
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(e) => {
                const target = e.currentTarget;
                setImgSize({
                  w: target.naturalWidth,
                  h: target.naturalHeight,
                });
              }}
              loading="eager"
              decoding="async"
              className={cn(
                "block h-full w-full select-none transition-opacity duration-200",
                imgSize ? "opacity-100" : "opacity-0",
              )}
              style={{ display: "block" }}
            />
          </>
        ) : (
          <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
            Canvas not ready yet — screenshot is still being captured.
          </div>
        )}

        {!hidePins && imgSize ? (
          <>
            {clusters.map((c) => (
              <div key={c.id} data-pin>
                <PinCluster
                  x={c.x}
                  y={c.y}
                  count={c.count}
                  unresolved={c.unresolved}
                  size={pinSize + 8}
                  onClick={() => {
                    // Zoom in to make individual pins legible, then surface
                    // the first thread so the user lands somewhere useful.
                    setZoomSmooth(1.5);
                    setActiveThread(c.firstThreadId);
                  }}
                />
              </div>
            ))}
            {soloPins.map((t) => {
              if (t.x_position == null || t.y_position == null) return null;
              const firstMessage = (t.messages ?? [])[0];
              const replyCount = Math.max(
                (t.messages?.length ?? 1) - 1,
                0,
              );
              return (
                <div key={t.id} data-pin>
                  <Pin
                    number={t.thread_number}
                    x={Number(t.x_position)}
                    y={Number(t.y_position)}
                    active={activeThreadId === t.id}
                    resolved={t.status === "resolved"}
                    priority={t.priority}
                    size={pinSize}
                    onClick={() => setActiveThread(t.id)}
                    onMove={
                      onMovePin
                        ? (x, y) => onMovePin(t.id, x, y, 1)
                        : undefined
                    }
                    previewText={firstMessage?.content ?? undefined}
                    replyCount={replyCount}
                  />
                </div>
              );
            })}
            {pendingPin ? (
              <div
                data-pin
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-primary bg-primary/20"
                style={{
                  left: `${pendingPin.x}%`,
                  top: `${pendingPin.y}%`,
                  width: pinSize + 4,
                  height: pinSize + 4,
                }}
              />
            ) : null}
            {renderOverlay?.(1)}
          </>
        ) : null}
      </div>
    </div>
  );
}
