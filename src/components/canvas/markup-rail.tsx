"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { ChevronRight, FileText, Globe, Image as ImageIcon } from "lucide-react";
import type { CanvasSibling } from "@/components/canvas/types";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface MarkupRailProps {
  workspaceId: string;
  siblings: CanvasSibling[];
  currentId: string;
}

const TYPE_ICON = {
  image: ImageIcon,
  pdf: FileText,
  website: Globe,
} as const;

/**
 * Right-edge thumbnail strip showing sibling MarkUps in the same folder.
 * Mirrors markup.io's per-page navigation rail. Auto-scrolls the active
 * thumbnail into view on mount + when navigating with prev/next.
 */
export function MarkupRail({
  workspaceId,
  siblings,
  currentId,
}: MarkupRailProps) {
  const collapsed = useCanvasStore((s) => s.railCollapsed);
  const setCollapsed = useCanvasStore((s) => s.setRailCollapsed);
  const railRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = railRef.current?.querySelector(`[data-id="${currentId}"]`);
    if (el && "scrollIntoView" in el) {
      (el as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentId]);

  if (siblings.length <= 1) return null;

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-l border-border bg-card transition-[width] duration-200",
        collapsed ? "w-9" : "w-[160px]",
      )}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-4 z-10 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm hover:text-foreground"
        aria-label={collapsed ? "Expand rail" : "Collapse rail"}
      >
        <ChevronRight
          className={cn(
            "size-3.5 transition-transform",
            collapsed ? "" : "rotate-180",
          )}
        />
      </button>

      {collapsed ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground [writing-mode:vertical-lr]">
            {siblings.findIndex((s) => s.id === currentId) + 1} /{" "}
            {siblings.length}
          </span>
        </div>
      ) : (
        <div ref={railRef} className="flex-1 space-y-2 overflow-y-auto p-2">
          {siblings.map((s, idx) => {
            const Icon = TYPE_ICON[s.type] ?? FileText;
            const isActive = s.id === currentId;
            return (
              <Link
                key={s.id}
                data-id={s.id}
                href={`/w/${workspaceId}/markup/${s.id}`}
                className={cn(
                  "group flex flex-col gap-1.5 rounded-lg border bg-background p-1.5 transition-colors",
                  isActive
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
                aria-current={isActive ? "page" : undefined}
                title={s.title}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
                  {s.thumbnail_url ? (
                    <Image
                      src={s.thumbnail_url}
                      alt={s.title}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                  ) : s.type === "website" ? (
                    // Website screenshots are produced async by Apify. Until
                    // the webhook lands, surface a "rendering" state instead
                    // of a silent icon so users understand what's happening.
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
                      <Globe className="size-5 animate-pulse" strokeWidth={1.25} />
                      <span className="text-[9px] font-semibold uppercase tracking-wider">
                        rendering…
                      </span>
                    </div>
                  ) : s.type === "pdf" ? (
                    // PDF thumbnails generate on first canvas open; if none
                    // yet, show the file icon.
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Icon className="size-5" strokeWidth={1.25} />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Icon className="size-5" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 px-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold tabular-nums",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {(idx + 1).toString().padStart(2, "0")}.
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px] font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
