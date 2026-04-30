"use client";

import { History, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuestVersion {
  id: string;
  version_number: number;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_current: boolean;
  created_at: string;
}

interface GuestVersionRailProps {
  versions: GuestVersion[];
  onClose?: () => void;
}

/**
 * Read-only versions rail for guests. Lists every revision of the shared
 * MarkUp; the current version is highlighted. Clicks are no-ops because
 * guests don't get to switch versions on a public link.
 */
export function GuestVersionRail({ versions, onClose }: GuestVersionRailProps) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <History className="size-4" /> Versions
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {versions.length}{" "}
            {versions.length === 1 ? "version" : "versions"}
          </p>
        </div>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <ul className="flex-1 divide-y divide-border overflow-y-auto">
        {versions.length === 0 ? (
          <li className="p-4 text-center text-xs text-muted-foreground">
            No versions yet.
          </li>
        ) : (
          versions.map((v) => (
            <li
              key={v.id}
              className={cn(
                "px-4 py-3",
                v.is_current && "bg-accent/40",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-foreground">
                  v{v.version_number}
                </span>
                {v.is_current ? (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                {v.file_name ?? "—"}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {format(new Date(v.created_at), "MMM d, yyyy")}
                {v.file_size
                  ? ` · ${formatBytes(v.file_size)}`
                  : ""}
              </p>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
