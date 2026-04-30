"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Composer } from "@/components/canvas/composer";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/stores/canvas-store";
import type { GuestIdentity } from "@/hooks/use-guest-identity";

interface GuestPinComposerProps {
  shareToken: string;
  identity: GuestIdentity | null;
  requestIdentity: () => void;
}

/**
 * Mirrors PendingPinComposer but posts to the guest API. If no cached
 * identity exists, we prompt the user via the parent's modal first; once
 * captured, the dropped pin remains pending so they can submit their
 * comment.
 */
export function GuestPinComposer({
  shareToken,
  identity,
  requestIdentity,
}: GuestPinComposerProps) {
  const router = useRouter();
  const pendingPin = useCanvasStore((s) => s.pendingPin);
  const startPin = useCanvasStore((s) => s.startPin);

  // If a pin is dropped before the guest has identified themselves, open
  // the identity modal. Once they save it, the pin remains pending.
  useEffect(() => {
    if (pendingPin && !identity) {
      requestIdentity();
    }
  }, [pendingPin, identity, requestIdentity]);

  if (!pendingPin || !identity) return null;

  async function submit(content: string) {
    if (!pendingPin || !identity) return;
    const res = await fetch(`/api/share/${shareToken}/threads`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        guest: { name: identity.name, email: identity.email ?? "" },
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
    toast.success("Pin dropped");
    startPin(null);
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
              New pin · {identity.name}
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
        <div className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card" />
      </div>
    </div>
  );
}
