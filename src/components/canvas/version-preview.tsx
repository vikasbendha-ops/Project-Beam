"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2 } from "lucide-react";
import { categoryFromMime } from "@/lib/mime";

// Lazy-load the heavy renderers (pdf.js, Office iframe, fetch loop) so the
// version-history page itself stays light.
const PdfPreview = dynamic(
  () => import("@/components/canvas/pdf-canvas").then((m) => m.PdfCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading PDF…
      </div>
    ),
  },
);
const OfficePreview = dynamic(
  () =>
    import("@/components/canvas/office-canvas").then((m) => m.OfficeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading document…
      </div>
    ),
  },
);
const TextPreview = dynamic(
  () => import("@/components/canvas/text-canvas").then((m) => m.TextCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
      </div>
    ),
  },
);

interface VersionPreviewProps {
  url: string | null;
  mime: string | null;
  fileName?: string | null;
  /** When true, the canvas-store-driven sub-renderers (PDF/Office/Text)
   *  still respect their internal mode logic. We always pass an empty
   *  threads array so the preview pane never shows pins from another
   *  version by accident. */
}

/**
 * Read-only renderer used inside the Version-history right pane. Reuses the
 * same canvas viewers as the live editor but with an empty threads array
 * so no pins ever leak into the preview.
 */
export function VersionPreview({ url, mime, fileName }: VersionPreviewProps) {
  if (!url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <FileText className="size-8 opacity-40" />
        File not available.
      </div>
    );
  }

  const category = categoryFromMime(mime);

  if (category === "image") {
    // Plain <img> beats ImageCanvas here — no pan/zoom needed for review.
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName ?? "Version preview"}
          className="max-h-full max-w-full rounded-lg border border-border object-contain shadow-card"
        />
      </div>
    );
  }

  if (category === "pdf") {
    return <PdfPreview src={url} threads={[]} />;
  }

  if (category === "office") {
    return (
      <OfficePreview src={url} fileName={fileName ?? null} threads={[]} />
    );
  }

  if (category === "text") {
    return <TextPreview src={url} mime={mime} threads={[]} />;
  }

  // Unknown or unsupported preview — offer download.
  return <UnknownPreview url={url} fileName={fileName ?? null} />;
}

function UnknownPreview({
  url,
  fileName,
}: {
  url: string;
  fileName: string | null;
}) {
  // Try to detect HEAD content-length so we don't dump a 50 MB binary into the
  // tab. We only do this lazily when the user clicks "Open original".
  const [size, setSize] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url, { method: "HEAD" });
        const len = Number(res.headers.get("content-length"));
        if (!cancelled && Number.isFinite(len)) setSize(len);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-muted-foreground">
      <FileText className="size-10 opacity-40" />
      <p>Preview not supported for this file type.</p>
      {fileName ? (
        <p className="text-xs">
          <span className="font-semibold text-foreground">{fileName}</span>
          {size ? ` · ${formatBytes(size)}` : ""}
        </p>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
      >
        <ExternalLink className="size-3.5" /> Open original
      </a>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
