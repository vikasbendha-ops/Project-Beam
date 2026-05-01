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
}

const ALLOWED_MIMES = ACCEPTED_UPLOAD_MIMES;

export function VersionHistoryView({
  workspaceId,
  markup,
  versions,
  profiles,
  threadCountsByVersion,
}: VersionHistoryViewProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
                  />
                  <PreviewPane
                    label={`v${current.version_number} · Current`}
                    side="right"
                    version={current}
                  />
                </div>
              ) : (
                <div className="flex flex-1 overflow-hidden">
                  <VersionPreview
                    url={selected.signed_url}
                    mime={selected.mime_type}
                    fileName={selected.file_name}
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

/** Side-by-side compare cell: a small caption above the rendered version. */
function PreviewPane({
  label,
  side,
  version,
}: {
  label: string;
  side: "left" | "right";
  version: Version;
}) {
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
      </div>
    </div>
  );
}
