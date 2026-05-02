"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Globe, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasAsset } from "@/components/canvas/canvas-viewer";

interface AssetRailProps {
  assets: CanvasAsset[];
  activeAssetId: string | null;
  onAddAsset?: () => void;
}

/**
 * Horizontal rail of assets that belong to the current markup. Visible
 * only when the markup has 2+ assets, OR when an "Add asset" handler is
 * passed (so members can grow a single-asset markup into multi-asset).
 *
 * Each thumb is a Link with `?asset=<id>` so navigation between assets is
 * a server-side render (consistent thread fetch + signed-URL refresh).
 */
export function AssetRail({
  assets,
  activeAssetId,
  onAddAsset,
}: AssetRailProps) {
  const search = useSearchParams();
  if (assets.length <= 1 && !onAddAsset) return null;
  const queryFor = (id: string) => {
    const next = new URLSearchParams(search.toString());
    next.set("asset", id);
    return `?${next.toString()}`;
  };
  return (
    <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/80 px-3 py-2 backdrop-blur">
      <span className="shrink-0 pr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Assets · {assets.length}
      </span>
      {assets.map((a) => {
        const Icon =
          a.type === "image"
            ? ImageIcon
            : a.type === "website"
              ? Globe
              : FileText;
        const active = a.id === activeAssetId;
        return (
          <Link
            key={a.id}
            href={queryFor(a.id)}
            scroll={false}
            className={cn(
              "group/asset flex shrink-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
            title={a.title}
            aria-current={active ? "true" : undefined}
          >
            <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
              {a.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.thumbnail_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <Icon className="size-3.5" strokeWidth={1.5} />
              )}
            </span>
            <span className="max-w-[140px] truncate">{a.title}</span>
          </Link>
        );
      })}
      {onAddAsset ? (
        <button
          type="button"
          onClick={onAddAsset}
          className="ml-1 flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-border px-2 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="size-3.5" strokeWidth={1.75} />
          Add asset
        </button>
      ) : null}
    </div>
  );
}
