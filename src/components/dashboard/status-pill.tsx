import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type MarkupStatus = Database["public"]["Enums"]["markup_status"];

const LABELS: Record<MarkupStatus, string> = {
  draft: "Draft",
  ready_for_review: "Ready",
  changes_requested: "Changes",
  approved: "Approved",
};

const STYLES: Record<MarkupStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  ready_for_review: "bg-sky-100 text-sky-700",
  changes_requested: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-700",
};

interface StatusPillProps {
  status: MarkupStatus;
  className?: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, className, size = "md" }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-xs",
        STYLES[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "draft" && "bg-muted-foreground/60",
          status === "ready_for_review" && "bg-sky-500",
          status === "changes_requested" && "bg-amber-500",
          status === "approved" && "bg-emerald-500",
        )}
      />
      {LABELS[status]}
    </span>
  );
}
