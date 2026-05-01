"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ExternalLink,
  History,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import { GuestCommentList } from "@/components/canvas/guest-comment-list";
import { GuestIdentityModal } from "@/components/canvas/guest-identity-modal";
import { GuestPinComposer } from "@/components/canvas/guest-pin-composer";
import { GuestVersionRail } from "@/components/canvas/guest-version-rail";
import { ImageCanvas } from "@/components/canvas/image-canvas";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { StatusPill } from "@/components/dashboard/status-pill";
import { BeamWordmark } from "@/components/shared/beam-mark";
import { Button } from "@/components/ui/button";
import { useGuestIdentity } from "@/hooks/use-guest-identity";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCanvasStore } from "@/stores/canvas-store";
import { categoryFromMime } from "@/lib/mime";
import { cn } from "@/lib/utils";
import type {
  CanvasMarkup,
  CanvasProfile,
  CanvasThread,
  CanvasVersion,
} from "@/components/canvas/types";

const PdfCanvas = dynamic(
  () => import("@/components/canvas/pdf-canvas").then((m) => m.PdfCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-muted-foreground">Loading PDF…</div>
    ),
  },
);
const OfficeCanvas = dynamic(
  () =>
    import("@/components/canvas/office-canvas").then((m) => m.OfficeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-muted-foreground">Loading document…</div>
    ),
  },
);
const TextCanvas = dynamic(
  () => import("@/components/canvas/text-canvas").then((m) => m.TextCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="text-sm text-muted-foreground">Loading…</div>
    ),
  },
);

interface GuestVersionRow {
  id: string;
  version_number: number;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_current: boolean;
  created_at: string;
}

interface GuestCanvasProps {
  shareToken: string;
  canComment: boolean;
  markup: CanvasMarkup;
  version: CanvasVersion | null;
  versions: GuestVersionRow[];
  threads: CanvasThread[];
  profiles: CanvasProfile[];
}

export function GuestCanvas({
  shareToken,
  canComment,
  markup,
  version,
  versions,
  threads,
  profiles,
}: GuestCanvasProps) {
  const isMobile = useIsMobile();
  const { identity, save, prompt, setPrompt } = useGuestIdentity();
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const profileMap = useMemo(() => {
    const m: Record<string, CanvasProfile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);

  // ESC closes whichever drawer is open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (rightOpen) setRightOpen(false);
        else if (leftOpen) setLeftOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [leftOpen, rightOpen]);

  // When a thread is activated from the comment list (mobile especially),
  // close the left drawer so the popover is visible.
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  useEffect(() => {
    if (activeThreadId && isMobile) setLeftOpen(false);
  }, [activeThreadId, isMobile]);

  const hasVariations = versions.length > 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted">
      {/* Top bar */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={leftOpen ? "Hide comments" : "Show comments"}
            aria-pressed={leftOpen}
            onClick={() => setLeftOpen((v) => !v)}
            className="relative"
          >
            <MessageSquare className="size-5" />
            {threads.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {threads.length > 99 ? "99+" : threads.length}
              </span>
            ) : null}
          </Button>
          <BeamWordmark className="text-lg" />
          <span className="hidden h-5 w-px bg-border sm:inline-block" />
          <div className="hidden min-w-0 sm:block">
            <h1 className="truncate text-sm font-semibold text-foreground">
              {markup.title}
            </h1>
            {markup.source_url ? (
              <a
                href={markup.source_url}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1 truncate text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary md:inline-flex"
              >
                <ExternalLink className="size-2.5" /> {markup.source_url}
              </a>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusPill
            status={markup.status}
            className="hidden md:inline-flex"
            size="sm"
          />
          {identity ? (
            <span className="hidden items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground md:inline-flex">
              {identity.name}
            </span>
          ) : null}
          {hasVariations ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={rightOpen ? "Hide versions" : "Show versions"}
              aria-pressed={rightOpen}
              onClick={() => setRightOpen((v) => !v)}
            >
              <History className="size-5" />
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </header>

      <div className="relative flex flex-1 overflow-hidden">
        {/* Left drawer — comments */}
        <DrawerSidebar
          open={leftOpen}
          side="left"
          onClose={() => setLeftOpen(false)}
        >
          <GuestCommentList
            threads={threads}
            profiles={profileMap}
            onClose={() => setLeftOpen(false)}
          />
        </DrawerSidebar>

        {/* Canvas main */}
        <main className="relative flex flex-1 overflow-hidden">
          {(() => {
            const docCategory = categoryFromMime(version?.mime_type);
            if (markup.type === "pdf" && docCategory === "office") {
              return (
                <OfficeCanvas
                  src={markup.canvasUrl}
                  fileName={version?.file_name}
                  threads={threads}
                />
              );
            }
            if (markup.type === "pdf" && docCategory === "text") {
              return (
                <TextCanvas
                  src={markup.canvasUrl}
                  mime={version?.mime_type}
                  threads={threads}
                />
              );
            }
            if (markup.type === "pdf") {
              return <PdfCanvas src={markup.canvasUrl} threads={threads} />;
            }
            return (
              <ImageCanvas
                src={markup.canvasUrl}
                alt={markup.title}
                threads={threads}
                pinSize={isMobile ? 32 : 28}
                renderOverlay={() =>
                  canComment ? (
                    <GuestPinComposer
                      shareToken={shareToken}
                      identity={identity}
                      requestIdentity={() => setPrompt(true)}
                    />
                  ) : null
                }
              />
            );
          })()}
          <ZoomControls />
          <div className="pointer-events-none absolute bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground backdrop-blur">
            <Sparkles className="size-3 text-primary" /> Made with Beam
          </div>
          {!canComment ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <div className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-card">
                View-only link · comments disabled
              </div>
            </div>
          ) : null}
        </main>

        {/* Right drawer — versions */}
        {hasVariations ? (
          <DrawerSidebar
            open={rightOpen}
            side="right"
            onClose={() => setRightOpen(false)}
          >
            <GuestVersionRail
              versions={versions}
              onClose={() => setRightOpen(false)}
            />
          </DrawerSidebar>
        ) : null}
      </div>

      <GuestIdentityModal
        open={prompt}
        onOpenChange={setPrompt}
        onSave={save}
      />
    </div>
  );
}

function DrawerSidebar({
  open,
  side,
  onClose,
  children,
}: {
  open: boolean;
  side: "left" | "right";
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close drawer"
          onClick={onClose}
          className="absolute inset-0 z-30 bg-foreground/30 backdrop-blur-[1px] md:hidden"
        />
      ) : null}
      <aside
        className={cn(
          "absolute z-40 h-full w-[300px] shrink-0 transform bg-card shadow-modal transition-transform duration-200 ease-out md:w-[320px]",
          side === "left" ? "left-0" : "right-0",
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full",
        )}
        aria-hidden={!open}
      >
        {children}
      </aside>
    </>
  );
}
