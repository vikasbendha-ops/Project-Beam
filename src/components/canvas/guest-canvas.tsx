"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { ImageCanvas } from "@/components/canvas/image-canvas";
import { GuestPinComposer } from "@/components/canvas/guest-pin-composer";
import { GuestIdentityModal } from "@/components/canvas/guest-identity-modal";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { StatusPill } from "@/components/dashboard/status-pill";
import { BeamWordmark } from "@/components/shared/beam-mark";
import { Button } from "@/components/ui/button";
import { useGuestIdentity } from "@/hooks/use-guest-identity";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  CanvasMarkup,
  CanvasProfile,
  CanvasThread,
  CanvasVersion,
} from "@/components/canvas/types";

const PdfCanvas = dynamic(
  () => import("@/components/canvas/pdf-canvas").then((m) => m.PdfCanvas),
  { ssr: false, loading: () => <div className="text-sm text-muted-foreground">Loading PDF…</div> },
);

interface GuestCanvasProps {
  shareToken: string;
  canComment: boolean;
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  threads: CanvasThread[];
  profiles: CanvasProfile[];
}

export function GuestCanvas({
  shareToken,
  canComment,
  markup,
  version,
  threads,
  profiles,
}: GuestCanvasProps) {
  const isMobile = useIsMobile();
  const { identity, save, prompt, setPrompt } = useGuestIdentity();
  const profileMap = useMemo(() => {
    const m: Record<string, CanvasProfile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BeamWordmark className="text-xl" />
          <span className="hidden h-6 w-px bg-border sm:inline-block" />
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {markup.title}
            </h1>
            {markup.source_url ? (
              <a
                href={markup.source_url}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
              >
                <ExternalLink className="size-3" /> {markup.source_url}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={markup.status} className="hidden sm:inline-flex" />
          {identity ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground sm:inline-flex">
              Reviewing as {identity.name}
            </span>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden">
        {markup.type === "pdf" ? (
          <PdfCanvas src={markup.canvasUrl} threads={threads} />
        ) : (
          <ImageCanvas
            src={markup.canvasUrl}
            alt={markup.title}
            threads={threads}
            pinSize={isMobile ? 32 : 28}
          />
        )}

        {canComment ? (
          <GuestPinComposer
            shareToken={shareToken}
            identity={identity}
            requestIdentity={() => setPrompt(true)}
          />
        ) : null}

        <ZoomControls />

        <div className="pointer-events-none absolute bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
          <Sparkles className="size-3 text-primary" /> Made with Beam
        </div>
      </main>

      <GuestIdentityModal
        open={prompt}
        onOpenChange={setPrompt}
        onSave={save}
      />

      {!canComment ? (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center">
          <div className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-card">
            View-only link · comments disabled
          </div>
        </div>
      ) : null}
    </div>
  );
}
