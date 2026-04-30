"use client";

import { X } from "lucide-react";
import { Composer } from "@/components/canvas/composer";
import { Button } from "@/components/ui/button";
import { useCanvasMutators } from "@/components/canvas/canvas-state";
import { useCanvasStore } from "@/stores/canvas-store";

interface PendingPinComposerProps {
  markupId: string;
  versionId: string | null;
}

/**
 * Floating composer anchored to the dropped pin's % coords. Rendered
 * INSIDE the image stage (via ImageCanvas's renderOverlay) so the
 * percentages match the canvas coordinate space — same context as pins.
 */
export function PendingPinComposer({
  markupId: _markupId,
  versionId: _versionId,
}: PendingPinComposerProps) {
  const pendingPin = useCanvasStore((s) => s.pendingPin);
  const startPin = useCanvasStore((s) => s.startPin);
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const { createThread } = useCanvasMutators();

  if (!pendingPin) return null;

  // Flip horizontally past 60% x and vertically past 60% y to keep the
  // composer inside the viewport.
  const flipLeft = pendingPin.x > 60;
  const flipUp = pendingPin.y > 60;

  async function submit(content: string) {
    if (!pendingPin) return;
    const id = await createThread({
      x: pendingPin.x,
      y: pendingPin.y,
      pageNumber: pendingPin.pageNumber,
      content,
    });
    if (id) {
      startPin(null);
      setActiveThread(id);
    }
  }

  return (
    <div
      data-popover
      className="absolute z-30"
      style={{
        left: `${pendingPin.x}%`,
        top: `${pendingPin.y}%`,
        transform: `translate(${flipLeft ? "calc(-100% - 18px)" : "18px"}, ${
          flipUp ? "calc(-100% + 14px)" : "-14px"
        })`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <div className="w-[280px] rounded-[14px] border border-border bg-card p-3 shadow-modal">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              New pin
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => startPin(null)}
              aria-label="Cancel"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <Composer
            placeholder="Drop a comment here…"
            submitLabel="Post"
            autoFocus
            onSubmit={submit}
          />
        </div>
      </div>
    </div>
  );
}
