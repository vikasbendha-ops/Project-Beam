"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Composer } from "@/components/canvas/composer";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/stores/canvas-store";

interface PendingPinComposerProps {
  markupId: string;
  versionId: string | null;
}

/**
 * Modal-ish composer that opens when the user drops a new pin. Submits
 * create the thread + first message in one POST /api/threads call.
 */
export function PendingPinComposer({
  markupId,
  versionId,
}: PendingPinComposerProps) {
  const router = useRouter();
  const pendingPin = useCanvasStore((s) => s.pendingPin);
  const startPin = useCanvasStore((s) => s.startPin);
  const setActiveThread = useCanvasStore((s) => s.setActiveThread);

  if (!pendingPin) return null;

  async function submit(content: string) {
    if (!pendingPin) return;
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        markup_id: markupId,
        markup_version_id: versionId,
        x_position: pendingPin.x,
        y_position: pendingPin.y,
        page_number: pendingPin.pageNumber ?? null,
        content,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error ?? "Couldn't drop pin");
    }
    const { thread_id } = (await res.json()) as { thread_id: string };
    toast.success("Pin dropped");
    startPin(null);
    setActiveThread(thread_id);
    router.refresh();
  }

  return (
    <div
      className="absolute z-30 w-[280px]"
      style={{
        left: `${pendingPin.x}%`,
        top: `${pendingPin.y}%`,
        transform: "translate(-50%, calc(-100% - 14px))",
      }}
    >
      <div className="relative">
        <div className="rounded-[14px] border border-border bg-card p-3 shadow-modal">
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
        {/* Triangle pointer */}
        <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card" />
      </div>
    </div>
  );
}
