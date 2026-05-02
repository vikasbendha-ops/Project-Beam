"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Columns2,
  FileText,
  History,
  Loader2,
  Menu,
  MessageSquare,
  Trash2,
  Upload,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VersionPreview } from "@/components/canvas/version-preview";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import { ACCEPTED_UPLOAD_MIMES, type AcceptedMime } from "@/lib/mime";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type VersionRow = Pick<
  Database["public"]["Tables"]["markup_versions"]["Row"],
  | "id"
  | "version_number"
  | "file_url"
  | "file_name"
  | "file_size"
  | "mime_type"
  | "page_count"
  | "uploaded_by"
  | "is_current"
  | "created_at"
>;

/** Each row arrives with an already-signed URL so the preview pane can
 *  render the document without another network round-trip. */
export type Version = VersionRow & { signed_url: string | null };

export interface CompareThread {
  id: string;
  thread_number: number;
  x_position: number | null;
  y_position: number | null;
  page_number: number | null;
  status: string;
  priority: string;
  markup_version_id: string | null;
  preview: string | null;
}

interface VersionHistoryViewProps {
  workspaceId: string;
  markup: { id: string; title: string; type: string };
  versions: Version[];
  profiles: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  }[];
  threadCountsByVersion: Record<string, number>;
  threads: CompareThread[];
}

const ALLOWED_MIMES = ACCEPTED_UPLOAD_MIMES;

export function VersionHistoryView({
  workspaceId,
  markup,
  versions,
  profiles,
  threadCountsByVersion,
  threads,
}: VersionHistoryViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const focusMenuOpen = useUIStore((s) => s.focusMenuOpen);
  const setFocusMenuOpen = useUIStore((s) => s.setFocusMenuOpen);
  const profileMap = profiles.reduce<Record<string, (typeof profiles)[0]>>(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {},
  );
  const current = versions.find((v) => v.is_current) ?? versions[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(
    current?.id ?? null,
  );
  const selected =
    versions.find((v) => v.id === selectedId) ?? current ?? null;
  const [compareMode, setCompareMode] = useState(false);
  // Compare only makes sense with two distinct versions.
  const canCompare =
    versions.length > 1 && selected && current && selected.id !== current.id;

  async function handleUpload(file: File) {
    if (!ALLOWED_MIMES.includes(file.type as AcceptedMime)) {
      toast.error(
        "Unsupported file. Allowed: images, PDF, Word, Excel, PowerPoint, plain text.",
      );
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`,
      );
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          filename: file.name,
          mime_type: file.type,
          size: file.size,
        }),
      });
      if (!signRes.ok) {
        const { error } = await signRes.json().catch(() => ({}));
        throw new Error(error ?? "Couldn't prepare upload");
      }
      const { signed_url, path } = (await signRes.json()) as {
        signed_url: string;
        path: string;
      };

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed_url);
        xhr.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(file);
      });

      const res = await fetch(`/api/markups/${markup.id}/versions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Couldn't register version");
      }
      toast.success("New version uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function restore(versionId: string) {
    if (!window.confirm("Restore this version as current?")) return;
    const res = await fetch(
      `/api/markups/${markup.id}/versions/${versionId}`,
      { method: "PATCH" },
    );
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't restore");
      return;
    }
    toast.success("Restored");
    router.refresh();
  }

  async function deleteVersion(versionId: string) {
    if (!window.confirm("Delete this version? This can't be undone.")) return;
    const res = await fetch(
      `/api/markups/${markup.id}/versions/${versionId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't delete");
      return;
    }
    toast.success("Deleted");
    if (selectedId === versionId) setSelectedId(null);
    router.refresh();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm md:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setFocusMenuOpen(!focusMenuOpen)}
            aria-label={
              focusMenuOpen ? "Close workspace menu" : "Open workspace menu"
            }
            aria-pressed={focusMenuOpen}
            className="hidden md:inline-flex"
          >
            <Menu className="size-5" />
          </Button>
          <Link
            href={`/w/${workspaceId}/markup/${markup.id}`}
            className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {markup.title}
              </span>
              <span className="text-base font-semibold text-foreground">
                Version history
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {canCompare ? (
            <Button
              type="button"
              variant={compareMode ? "default" : "ghost"}
              size="sm"
              onClick={() => setCompareMode((v) => !v)}
              aria-pressed={compareMode}
            >
              <Columns2 className="size-4" />
              {compareMode ? "Hide compare" : "Compare with current"}
            </Button>
          ) : null}
          {selected && !selected.is_current ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => restore(selected.id)}
            >
              <History className="size-4" />
              Restore this version
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Uploading {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload new version
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_MIMES.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[280px] shrink-0 flex-col overflow-y-auto border-r border-border bg-card">
          <div className="border-b border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">Versions</h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Select a version to preview or restore.
            </p>
          </div>
          <ul className="flex flex-col">
            {versions.length === 0 ? (
              <li className="p-4 text-xs text-muted-foreground">
                No versions yet.
              </li>
            ) : null}
            {versions.map((v) => {
              const author = v.uploaded_by ? profileMap[v.uploaded_by] : null;
              const initials = (author?.name ?? "?")
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const time = v.created_at
                ? formatDistanceToNow(new Date(v.created_at), {
                    addSuffix: true,
                  })
                : "";
              const isSelected = selectedId === v.id;
              return (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    className={cn(
                      "relative flex w-full flex-col gap-2 border-b border-border p-4 text-left transition-colors",
                      isSelected
                        ? "bg-accent"
                        : "bg-transparent hover:bg-muted/40",
                    )}
                  >
                    {isSelected ? (
                      <span className="absolute inset-y-0 left-0 w-1 bg-primary" />
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          v{v.version_number}
                        </span>
                        {v.is_current ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-6 border border-border">
                        {author?.avatar_url ? (
                          <AvatarImage
                            src={author.avatar_url}
                            alt={author.name}
                          />
                        ) : null}
                        <AvatarFallback className="bg-muted text-[9px] font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-foreground">
                        {author?.name ?? "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-3" />
                        {v.file_size
                          ? formatBytes(v.file_size)
                          : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {threadCountsByVersion[v.id] ?? 0}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden bg-muted">
          {!selected ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Pick a version on the left to inspect it.
            </div>
          ) : (
            <>
              <PreviewHeader
                selected={selected}
                onDelete={() => deleteVersion(selected.id)}
              />
              {compareMode && canCompare && current ? (
                <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
                  <PreviewPane
                    label={`v${selected.version_number}${
                      selected.is_current ? " · Current" : ""
                    }`}
                    side="left"
                    version={selected}
                    threads={threads}
                    versions={versions}
                  />
                  <PreviewPane
                    label={`v${current.version_number} · Current`}
                    side="right"
                    version={current}
                    threads={threads}
                    versions={versions}
                  />
                </div>
              ) : (
                <div className="relative flex flex-1 overflow-hidden">
                  <VersionPreview
                    url={selected.signed_url}
                    mime={selected.mime_type}
                    fileName={selected.file_name}
                  />
                  {/* Read-only pin overlay for THIS version only. */}
                  <ComparePinOverlay
                    threads={threads.filter(
                      (t) => t.markup_version_id === selected.id,
                    )}
                    activeVersionId={selected.id}
                    versionNumberById={versions.reduce<Record<string, number>>(
                      (acc, v) => {
                        acc[v.id] = v.version_number;
                        return acc;
                      },
                      {},
                    )}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Strip above the preview area: file name + size + date, plus a Delete
 *  affordance for non-current versions. The actual preview lives below. */
function PreviewHeader({
  selected,
  onDelete,
}: {
  selected: Version;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-card px-6 py-4">
      <div>
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          v{selected.version_number}
          {selected.is_current ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Current
            </span>
          ) : null}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {selected.file_name ?? "—"} ·{" "}
          {selected.file_size ? formatBytes(selected.file_size) : "—"} ·{" "}
          {selected.created_at
            ? format(
                new Date(selected.created_at),
                "MMM d, yyyy 'at' h:mm a",
              )
            : "—"}
        </p>
      </div>
      {!selected.is_current ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}

/** Side-by-side compare cell: a small caption above the rendered version,
 *  with all-versions pin overlay (read-only). Pins from any version are
 *  rendered on every pane at their original % coords; each pin shows a
 *  small version badge so authors can see context across versions. */
function PreviewPane({
  label,
  side,
  version,
  threads,
  versions,
}: {
  label: string;
  side: "left" | "right";
  version: Version;
  threads: CompareThread[];
  versions: Version[];
}) {
  // Map version-id → version-number for badge labels.
  const versionNumberById = versions.reduce<Record<string, number>>(
    (acc, v) => {
      acc[v.id] = v.version_number;
      return acc;
    },
    {},
  );

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden",
        side === "left" ? "border-r border-border" : null,
      )}
    >
      <div className="shrink-0 border-b border-border bg-card/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur">
        {label}
      </div>
      <div className="relative flex-1 overflow-hidden">
        <VersionPreview
          url={version.signed_url}
          mime={version.mime_type}
          fileName={version.file_name}
        />
        {/* Each pane shows ONLY its own version's pins. Comments belong to
           the version they were written on; cross-version overlay was
           confusing because both panes ended up identical. */}
        <ComparePinOverlay
          threads={threads.filter(
            // Show pins that belong to this version. Threads with NULL
            // version (legacy/unmigrated rows) appear on every version
            // so they're not lost.
            (t) =>
              t.markup_version_id === version.id ||
              t.markup_version_id == null,
          )}
          activeVersionId={version.id}
          versionNumberById={versionNumberById}
        />
      </div>
    </div>
  );
}

/**
 * Read-only pin overlay for the compare panes. Renders pins from EVERY
 * version on top of whichever version is currently displayed in this pane.
 * Pins from the active version use the primary tint; pins from other
 * versions use a dimmer outlined treatment. Hovering a pin reveals its
 * comment preview + version badge.
 *
 * Coords are stored as % of the underlying image so they resolve against
 * whichever asset this pane is displaying — that's the requested behavior:
 * "comments of both can be seen on both exactly where they were added".
 */
function ComparePinOverlay({
  threads,
  activeVersionId,
  versionNumberById,
}: {
  threads: CompareThread[];
  activeVersionId: string;
  versionNumberById: Record<string, number>;
}) {
  const visible = threads.filter(
    (t) => t.x_position != null && t.y_position != null,
  );
  if (visible.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
      {/* The previewed image fills with object-contain inside p-4. We can't
         know its rendered box exactly here, but pins are absolute-positioned
         as % of the overlay container which spans the same flex cell — so
         they line up with the image as long as it's centered + contained. */}
      <div className="relative h-full w-full">
        {visible.map((t) => {
          const isOwnVersion = t.markup_version_id === activeVersionId;
          const vNum =
            t.markup_version_id && versionNumberById[t.markup_version_id];
          return (
            <div
              key={t.id}
              className="group/pin pointer-events-auto absolute"
              style={{
                left: `${t.x_position}%`,
                top: `${t.y_position}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <span
                className={cn(
                  "relative flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition-transform group-hover/pin:scale-110",
                  isOwnVersion
                    ? "bg-primary text-primary-foreground shadow-pin"
                    : "border-2 border-primary/40 bg-card/80 text-primary opacity-60",
                  t.status === "resolved" && isOwnVersion
                    ? "bg-emerald-500"
                    : "",
                  t.status === "resolved" && !isOwnVersion
                    ? "border-emerald-500/40 text-emerald-700"
                    : "",
                )}
                style={{
                  outline: isOwnVersion ? "2px solid white" : undefined,
                  outlineOffset: -2,
                }}
              >
                {t.thread_number}
                {vNum ? (
                  <span
                    className={cn(
                      "absolute -bottom-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-1 font-mono text-[8px] font-bold tabular-nums leading-none ring-2 ring-background",
                      isOwnVersion
                        ? "bg-foreground text-background"
                        : "bg-amber-500 text-white",
                    )}
                  >
                    v{vNum}
                  </span>
                ) : null}
              </span>
              {/* Hover preview */}
              <div className="pointer-events-none absolute left-7 top-0 z-10 hidden w-56 rounded-[10px] border border-border bg-card p-2.5 shadow-modal group-hover/pin:block">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Pin №{t.thread_number}
                  </span>
                  {vNum ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                        isOwnVersion
                          ? "bg-primary/10 text-primary"
                          : "bg-amber-500/10 text-amber-700",
                      )}
                    >
                      v{vNum}
                    </span>
                  ) : null}
                </div>
                {t.preview ? (
                  <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground">
                    {t.preview}
                  </p>
                ) : (
                  <p className="text-[11px] italic text-muted-foreground">
                    Empty thread
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
