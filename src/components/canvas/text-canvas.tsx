"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Pin } from "@/components/canvas/pin";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasThread } from "@/components/canvas/types";
import { cn } from "@/lib/utils";

interface TextCanvasProps {
  src: string | null;
  /** "text/plain" | "text/markdown" | "text/csv" — affects rendering. */
  mime?: string | null;
  threads: CanvasThread[];
  /** Page-scoped overlay slot. Text files have one page; always 1. */
  renderOverlay?: (pageNumber: number) => React.ReactNode;
}

/**
 * Renders plain-text and markdown files inline. We fetch the file once and
 * render it in a scrollable wrapper; pin coordinates are % of the wrapper.
 *
 * Markdown is rendered with a light-touch prose layout (no MD parser yet —
 * we keep it as monospace to preserve line numbering and indent). For full
 * MD rendering, swap this for a `react-markdown` setup later.
 */
export function TextCanvas({
  src,
  mime,
  threads,
  renderOverlay,
}: TextCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mode = useCanvasStore((s) => s.mode);
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);
  const startPin = useCanvasStore((s) => s.startPin);
  const pendingPin = useCanvasStore((s) => s.pendingPin);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    setText(null);
    setError(null);
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        const body = await res.text();
        if (cancelled) return;
        // Cap at 1 MB so a runaway file doesn't crash the browser.
        const MAX = 1024 * 1024;
        setText(body.length > MAX ? body.slice(0, MAX) + "\n\n…(truncated)" : body);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load file");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "comment") return;
    if ((e.target as HTMLElement).closest("[data-pin]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y =
      ((e.clientY - rect.top + e.currentTarget.scrollTop) /
        e.currentTarget.scrollHeight) *
      100;
    startPin({ x, y, pageNumber: 1 });
  }

  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        File not available yet.
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
  if (text == null) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading…
      </div>
    );
  }

  const isCsv = (mime ?? "").includes("csv");

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={cn(
        "relative h-full w-full overflow-auto bg-muted px-6 py-6",
        mode === "comment" ? "cursor-crosshair" : "cursor-text",
      )}
    >
      <pre
        className={cn(
          "relative mx-auto max-w-3xl whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-6 text-[13px] leading-relaxed text-foreground shadow-sm",
          isCsv ? "font-mono text-xs" : "font-mono",
        )}
      >
        {text}
      </pre>
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
  );
}
