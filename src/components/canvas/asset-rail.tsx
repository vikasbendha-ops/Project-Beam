"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText, Globe, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasAsset } from "@/components/canvas/canvas-viewer";

interface AssetRailProps {
  assets: CanvasAsset[];
  activeAssetId: string | null;
  /** Layout. Right-edge vertical strip is the default for canvas; horizontal
   *  is available for fallback contexts. */
  orientation?: "vertical" | "horizontal";
  /** Base path for the asset link. Auth canvas uses the current pathname
   *  (so search-params merge); guest canvas passes its share URL. */
  basePath?: string;
}

/**
 * Asset switcher within a single MarkUp. Vertical right-edge rail by
 * default — replaces the previous sibling-MarkUp rail so users only ever
 * see assets that belong to the markup they're inside.
 */
export function AssetRail({
  assets,
  activeAssetId,
  orientation = "vertical",
  basePath,
}: AssetRailProps) {
  const search = useSearchParams();
  if (assets.length <= 1) return null;

  const queryFor = (id: string) => {
    const next = new URLSearchParams(search.toString());
    next.set("asset", id);
    const qs = next.toString();
    if (basePath) return `${basePath}${qs ? `?${qs}` : ""}`;
    return `?${qs}`;
  };

  if (orientation === "horizontal") {
    return (
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/80 px-3 py-2 backdrop-blur">
        <span className="shrink-0 pr-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Assets · {assets.length}
        </span>
        {assets.map((a) => (
          <AssetChip
            key={a.id}
            asset={a}
            active={a.id === activeAssetId}
            href={queryFor(a.id)}
          />
        ))}
      </div>
    );
  }

  // Vertical (right edge). Mirrors the older MarkupRail layout but scoped
  // to assets within THIS markup only.
  return (
    <aside
      aria-label="Markup assets"
      className="flex h-full w-[120px] shrink-0 flex-col border-l border-border bg-card"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Assets · {assets.length}
        </p>
      </div>
      <ol className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {assets.map((a, idx) => {
          const active = a.id === activeAssetId;
          const Icon =
            a.type === "image"
              ? ImageIcon
              : a.type === "website"
                ? Globe
                : FileText;
          return (
            <li key={a.id}>
              <Link
                href={queryFor(a.id)}
                scroll={false}
                aria-current={active ? "true" : undefined}
                title={a.title}
                className={cn(
                  "group block overflow-hidden rounded-lg border transition-colors",
                  active
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {a.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbnail_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <Icon className="size-5" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 px-1.5 pt-1.5 pb-1">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span
                    className={cn(
                      "truncate text-[11px] font-medium",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {a.title}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function AssetChip({
  asset,
  active,
  href,
}: {
  asset: CanvasAsset;
  active: boolean;
  href: string;
}) {
  const Icon =
    asset.type === "image"
      ? ImageIcon
      : asset.type === "website"
        ? Globe
        : FileText;
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
      title={asset.title}
    >
      <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        {asset.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.thumbnail_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <Icon className="size-3.5" strokeWidth={1.5} />
        )}
      </span>
      <span className="max-w-[140px] truncate">{asset.title}</span>
    </Link>
  );
}
