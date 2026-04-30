"use client";

import {
  Eye,
  EyeOff,
  Maximize2,
  Minus,
  MoveHorizontal,
  MoveVertical,
  Plus,
} from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

export function ZoomControls() {
  const { zoom, fit, hidePins, zoomIn, zoomOut, setZoom, setFit, setHidePins } =
    useCanvasStore();

  return (
    <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card px-1.5 py-1 shadow-card">
      <FitButton
        label="Fit width"
        active={fit === "fit-width"}
        onClick={() => setFit("fit-width")}
        Icon={MoveHorizontal}
      />
      <FitButton
        label="Fit height"
        active={fit === "fit-height"}
        onClick={() => setFit("fit-height")}
        Icon={MoveVertical}
      />
      <span className="mx-0.5 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={zoomOut}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom out"
      >
        <Minus className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setZoom(1)}
        className={cn(
          "min-w-[44px] rounded px-1 text-center text-[11px] font-semibold transition-colors",
          fit === "actual" && zoom === 1
            ? "text-primary"
            : "text-foreground hover:text-primary",
        )}
        aria-label="100%"
      >
        {fit === "actual" ? `${Math.round(zoom * 100)}%` : fit.replace("-", " ")}
      </button>
      <button
        type="button"
        onClick={zoomIn}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Zoom in"
      >
        <Plus className="size-4" />
      </button>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <button
        type="button"
        onClick={() => setHidePins(!hidePins)}
        className={cn(
          "rounded-full p-1.5 transition-colors hover:bg-muted",
          hidePins
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={hidePins ? "Show pins" : "Hide pins"}
        title={hidePins ? "Show pins" : "Hide pins"}
      >
        {hidePins ? (
          <EyeOff className="size-4" />
        ) : (
          <Eye className="size-4" />
        )}
      </button>
    </div>
  );
}

function FitButton({
  label,
  active,
  onClick,
  Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-7 items-center justify-center rounded-full transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      aria-label={label}
      title={label}
    >
      <Icon className="size-3.5" />
    </button>
  );
}
