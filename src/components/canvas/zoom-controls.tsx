"use client";

import { Maximize2, Minus, Plus } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export function ZoomControls() {
  const zoom = useCanvasStore((s) => s.zoom);
  const zoomIn = useCanvasStore((s) => s.zoomIn);
  const zoomOut = useCanvasStore((s) => s.zoomOut);
  const resetView = useCanvasStore((s) => s.resetView);

  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-card">
      <button
        type="button"
        onClick={zoomOut}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom out"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-12 text-center text-xs font-semibold text-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        onClick={zoomIn}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom in"
      >
        <Plus className="size-4" />
      </button>
      <span className="mx-1 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={resetView}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Fit to screen"
      >
        <Maximize2 className="size-4" />
      </button>
    </div>
  );
}
