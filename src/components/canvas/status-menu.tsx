"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  PencilLine,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MarkupStatus } from "@/components/canvas/types";

const ICONS: Record<MarkupStatus, typeof Check> = {
  draft: PencilLine,
  ready_for_review: Clock,
  changes_requested: XCircle,
  approved: CheckCircle2,
};

const ORDER: MarkupStatus[] = [
  "draft",
  "ready_for_review",
  "changes_requested",
  "approved",
];

interface StatusMenuProps {
  markupId: string;
  current: MarkupStatus;
  /** When provided, renders only the dropdown trigger and skips the
   * primary action button. Used by the dashboard card. */
  triggerOnly?: boolean;
  /** Optional aria label for the trigger; defaults to "Change status". */
  triggerAriaLabel?: string;
  /** Externally bind for keyboard shortcuts. */
  onChangeRef?: (changer: (next: MarkupStatus) => Promise<void>) => void;
}

export function StatusMenu({
  markupId,
  current,
  triggerOnly,
  triggerAriaLabel,
  onChangeRef,
}: StatusMenuProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: MarkupStatus) {
    if (next === current) return;
    setBusy(true);
    const res = await fetch(`/api/markups/${markupId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Status update failed");
      return;
    }
    toast.success(`Status: ${STATUS_LABEL[next]}`);
    router.refresh();
  }

  // Expose the changer for keyboard shortcuts.
  if (onChangeRef) onChangeRef(setStatus);

  const PrimaryIcon = current === "approved" ? CheckCircle2 : CheckCircle2;
  const primaryAction: MarkupStatus =
    current === "approved" ? "ready_for_review" : "approved";
  const primaryLabel = current === "approved" ? "Reopen" : "Approve";

  if (triggerOnly) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={busy}
            aria-label={triggerAriaLabel ?? "Change status"}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            <span>Status</span>
          </Button>
        </DropdownMenuTrigger>
        <Items current={current} setStatus={setStatus} />
      </DropdownMenu>
    );
  }

  return (
    <div className="inline-flex items-center">
      <Button
        type="button"
        size="sm"
        onClick={() => setStatus(primaryAction)}
        disabled={busy}
        variant={current === "approved" ? "outline" : "default"}
        className="rounded-r-none border-r-0"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PrimaryIcon className="size-4" />
        )}
        {primaryLabel}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={current === "approved" ? "outline" : "default"}
            className="rounded-l-none px-2"
            disabled={busy}
            aria-label="More status options"
          >
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <Items current={current} setStatus={setStatus} />
      </DropdownMenu>
    </div>
  );
}

function Items({
  current,
  setStatus,
}: {
  current: MarkupStatus;
  setStatus: (next: MarkupStatus) => void | Promise<void>;
}) {
  return (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Set status
      </DropdownMenuLabel>
      {ORDER.map((s) => {
        const Icon = ICONS[s];
        const active = s === current;
        return (
          <DropdownMenuItem
            key={s}
            onSelect={() => setStatus(s)}
            className={cn(
              "flex items-center gap-2",
              active && "bg-muted/50 font-semibold",
            )}
          >
            <Icon
              className={cn(
                "size-4",
                s === "approved" && "text-emerald-600",
                s === "changes_requested" && "text-amber-600",
                s === "ready_for_review" && "text-sky-600",
                s === "draft" && "text-muted-foreground",
              )}
            />
            <span className="flex-1">{STATUS_LABEL[s]}</span>
            {active ? <Check className="size-4 text-muted-foreground" /> : null}
          </DropdownMenuItem>
        );
      })}
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
        Shortcuts: a · r · d · y
      </DropdownMenuLabel>
    </DropdownMenuContent>
  );
}
