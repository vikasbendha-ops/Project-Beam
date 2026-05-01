"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Pin } from "@/components/canvas/pin";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasThread } from "@/components/canvas/types";
import { cn } from "@/lib/utils";

interface OfficeCanvasProps {
  /** Public-fetchable URL of the office file (signed Supabase URL). */
  src: string | null;
  /** File-name suffix used for the "open in new tab" affordance. */
  fileName?: string | null;
  threads: CanvasThread[];
  /** Page-scoped overlay slot. Office docs collapse to a single page so
   *  this is always called with pageNumber=1. */
  renderOverlay?: (pageNumber: number) => React.ReactNode;
}

/**
 * Renders Word / Excel / PowerPoint / OpenDocument files via the Microsoft
 * Office Online viewer. The iframe is read-only by design; we layer a
 * transparent click-target on top so users can still drop comment pins.
 *
 * Limitations: the Office viewer paginates internally, so pin coordinates
 * are stored as % of the whole iframe area (page_number is always 1) and
 * follow the file's scroll position rather than a specific paragraph. For
 * paragraph-anchored feedback, export to PDF first.
 */
export function OfficeCanvas({
  src,
  fileName,
  threads,
  renderOverlay,
}: OfficeCanvasProps) {
  const mode = useCanvasStore((s) => s.mode);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const startPin = useCanvasStore((s) => s.startPin);
  const pendingPin = useCanvasStore((s) => s.pendingPin);
  const [iframeBroken, setIframeBroken] = useState(false);

  const viewerSrc = useMemo(() => {
    if (!src) return null;
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(src)}`;
  }, [src]);

  if (!src || !viewerSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Document not available yet.
      </div>
    );
  }

  function onOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "comment") return;
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    startPin({ x, y, pageNumber: 1 });
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-muted">
      {/* Viewer note + escape hatch */}
      <div className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-2 text-[11px] text-muted-foreground">
        <span className="truncate">
          {fileName ? <span className="font-semibold">{fileName}</span> : null}
          <span className="ml-2">
            Rendered by Microsoft Office Online ·{" "}
            {mode === "comment"
              ? "click anywhere to drop a pin"
              : "switch to Comment mode to add pins"}
          </span>
        </span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
        >
          Open original
          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="relative flex-1">
        {iframeBroken ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted-foreground">
            <p>
              Office viewer couldn&rsquo;t load this document. Try opening the
              original or convert it to PDF for full canvas rendering.
            </p>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-foreground hover:text-primary"
            >
              Open original ↗
            </a>
          </div>
        ) : (
          <iframe
            src={viewerSrc}
            className="absolute inset-0 h-full w-full border-0"
            title="Document preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
            onError={() => setIframeBroken(true)}
          />
        )}

        {/* Pin overlay — layered above the iframe. Pointer events are only
            captured in comment mode; browse mode lets clicks fall through to
            the iframe so users can scroll / interact with the document. */}
        <div
          onClick={onOverlayClick}
          className={cn(
            "absolute inset-0",
            mode === "comment"
              ? "cursor-crosshair"
              : "pointer-events-none cursor-default",
          )}
        >
          {threads.map((t) => {
            if (t.x_position == null || t.y_position == null) return null;
            return (
              <Pin
                key={t.id}
                number={t.thread_number}
                x={Number(t.x_position)}
                y={Number(t.y_position)}
                active={activeThreadId === t.id}
                resolved={t.status === "resolved"}
                onClick={() => setActiveThread(t.id)}
              />
            );
          })}
          {pendingPin && pendingPin.pageNumber === 1 ? (
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
          {renderOverlay?.(1)}
        </div>
      </div>
    </div>
  );
}
