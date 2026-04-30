"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pin } from "@/components/canvas/pin";
import type { CanvasThread } from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface ImageCanvasProps {
  src: string | null;
  alt?: string;
  threads: CanvasThread[];
  pinSize?: number;
}

/**
 * Pan-and-zoom image canvas with overlaid pins.
 *
 * Pan & zoom use CSS transforms on a wrapper div; coordinates remain
 * percentage-based so pins survive resizing. Pin clicks open the active
 * thread; canvas clicks (in `comment` mode) drop a pending pin.
 */
export function ImageCanvas({
  src,
  alt = "Canvas",
  threads,
  pinSize = 28,
}: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    panX: number;
    panY: number;
  } | null>(null);

  const {
    mode,
    zoom,
    panX,
    panY,
    activeThreadId,
    pendingPin,
    setPan,
    setZoom,
    setActiveThread,
    startPin,
  } = useCanvasStore();

  const [imgLoaded, setImgLoaded] = useState(false);

  // Wheel zoom (centred on cursor when scrolling).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return; // require modifier so scroll-to-pan still works on trackpads
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const next = Math.max(0.25, Math.min(4, zoom * (1 + delta)));
      setZoom(next);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, setZoom]);

  // Pan via drag (left-mouse hold). Only when in browse mode OR when not
  // clicking on a pin / inside the comment composer.
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      // Right-click would not reach here. Plain left clicks in comment mode
      // become pin drops, handled in onCanvasClick.
      if (mode === "comment") return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX,
        panY,
      };
    },
    [mode, panX, panY],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      setPan(
        drag.panX + (e.clientX - drag.startX),
        drag.panY + (e.clientY - drag.startY),
      );
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
  }, [setPan]);

  const onCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (mode !== "comment") return;
      // Ignore clicks that bubble from a pin button.
      if ((e.target as HTMLElement).closest("[data-pin]")) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x < 0 || x > 100 || y < 0 || y > 100) return;
      startPin({ x, y });
    },
    [mode, startPin],
  );

  const transform = useMemo(
    () => `translate(${panX}px, ${panY}px) scale(${zoom})`,
    [panX, panY, zoom],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden bg-muted",
        mode === "comment" ? "cursor-crosshair" : "cursor-grab",
        dragRef.current && "cursor-grabbing",
      )}
      onMouseDown={onMouseDown}
    >
      <div
        ref={stageRef}
        onClick={onCanvasClick}
        className="absolute left-1/2 top-1/2 origin-center"
        style={{ transform: `translate(-50%, -50%) ${transform}` }}
      >
        {src ? (
          // Use plain <img> so we don't need next/image for arbitrary signed URLs.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            onLoad={() => setImgLoaded(true)}
            className="block max-h-[70vh] max-w-[90vw] select-none rounded-lg shadow-card"
          />
        ) : (
          <div className="flex h-[70vh] w-[90vw] max-w-3xl items-center justify-center rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground">
            Canvas not ready yet — screenshot is still being captured.
          </div>
        )}

        {imgLoaded
          ? threads.map((t) => {
              if (t.x_position == null || t.y_position == null) return null;
              return (
                <div
                  key={t.id}
                  data-pin
                  style={{ position: "absolute", inset: 0 }}
                  className="pointer-events-none"
                >
                  <Pin
                    number={t.thread_number}
                    x={Number(t.x_position)}
                    y={Number(t.y_position)}
                    active={activeThreadId === t.id}
                    resolved={t.status === "resolved"}
                    size={pinSize}
                    onClick={() => setActiveThread(t.id)}
                    className="pointer-events-auto"
                  />
                </div>
              );
            })
          : null}

        {pendingPin ? (
          <div
            data-pin
            className="pointer-events-none absolute inset-0"
          >
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-dashed border-primary bg-primary/20"
              style={{
                left: `${pendingPin.x}%`,
                top: `${pendingPin.y}%`,
                width: pinSize + 4,
                height: pinSize + 4,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
