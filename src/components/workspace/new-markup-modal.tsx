"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Loader2,
  Presentation,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUIStore } from "@/stores/ui-store";
import {
  normalizeUrl,
  urlMarkupSchema,
  type UrlMarkupInput,
} from "@/lib/validations/markup";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";
import {
  ACCEPTED_UPLOAD_MIMES,
  categoryFromFile,
  categoryFromMime,
  markupTypeForCategory,
  type AcceptedMime,
} from "@/lib/mime";
import { cn } from "@/lib/utils";

const ACCEPTED_MIMES = ACCEPTED_UPLOAD_MIMES;

interface NewMarkupModalProps {
  workspaceId: string;
  folderId?: string | null;
}

export function NewMarkupModal({
  workspaceId,
  folderId = null,
}: NewMarkupModalProps) {
  const router = useRouter();
  // Pick up ?project=<id> from the dashboard URL so a MarkUp uploaded from
  // a project view actually lands in that project (not the workspace
  // default).
  const search = useSearchParams();
  const projectId = search.get("project");
  const open = useUIStore((s) => s.newMarkupOpen);
  const tab = useUIStore((s) => s.newMarkupTab);
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);

  return (
    <Dialog open={open} onOpenChange={(o) => setNewMarkupOpen(o)}>
      <DialogContent className="w-[min(640px,calc(100%-2rem))] !max-w-none gap-0 overflow-hidden p-0 sm:w-[600px]">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="text-xl">New MarkUp</DialogTitle>
          <DialogDescription>
            Upload a file or paste a URL to start collecting feedback.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setNewMarkupOpen(true, v as "url" | "file")}
          className="px-6 pt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">
              Upload file
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1">
              Add URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="pt-5">
            <FileTab
              workspaceId={workspaceId}
              folderId={folderId}
              projectId={projectId}
              onCreated={(id) => {
                setNewMarkupOpen(false);
                router.push(`/w/${workspaceId}/markup/${id}`);
                router.refresh();
              }}
              onCancel={() => setNewMarkupOpen(false)}
            />
          </TabsContent>

          <TabsContent value="url" className="pt-5">
            <UrlTab
              workspaceId={workspaceId}
              folderId={folderId}
              projectId={projectId}
              onCreated={(id) => {
                setNewMarkupOpen(false);
                router.push(`/w/${workspaceId}/markup/${id}`);
                router.refresh();
              }}
              onCancel={() => setNewMarkupOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function UrlTab({
  workspaceId,
  folderId,
  projectId,
  onCreated,
  onCancel,
}: {
  workspaceId: string;
  folderId: string | null;
  projectId: string | null;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const form = useForm<UrlMarkupInput>({
    resolver: zodResolver(urlMarkupSchema),
    defaultValues: { url: "", title: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const url = normalizeUrl(values.url);
    if (!url) {
      toast.error("Enter a valid URL");
      return;
    }
    const res = await fetch("/api/markups", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        folder_id: folderId,
        project_id: projectId ?? undefined,
        type: "website",
        source_url: url,
        title: values.title?.trim() || new URL(url).hostname,
      }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      toast.error(error ?? "Couldn't create MarkUp");
      return;
    }
    const { id } = (await res.json()) as { id: string };
    toast.success("Capturing screenshot — refresh in ~30s.");
    form.reset();
    onCreated(id);
  });

  return (
    <form className="flex flex-col gap-5 pb-2" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="markup-url">Public URL</Label>
        <Input
          id="markup-url"
          type="text"
          placeholder="https://example.com/page"
          aria-invalid={!!form.formState.errors.url}
          {...form.register("url")}
        />
        {form.formState.errors.url ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.url.message}
          </p>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          We&rsquo;ll capture a full-page screenshot via Apify and pin
          comments on the rendered image.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="markup-title">Title (optional)</Label>
        <Input
          id="markup-title"
          type="text"
          placeholder="Homepage hero"
          {...form.register("title")}
        />
      </div>
      <DialogFooter className="px-0 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Creating…
            </>
          ) : (
            "Create MarkUp"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface UploadState {
  file: File;
  progress: number;
  error: string | null;
}

type GroupMode = "bundle" | "separate";

function FileTab({
  workspaceId,
  folderId,
  projectId,
  onCreated,
  onCancel,
}: {
  workspaceId: string;
  folderId: string | null;
  projectId: string | null;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>("bundle");
  const [bundleTitle, setBundleTitle] = useState("");

  const validate = (f: File): string | null => {
    if (!ACCEPTED_MIMES.includes(f.type as AcceptedMime)) {
      return "Unsupported file. Allowed: images, PDF, Word, Excel, PowerPoint, plain text.";
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`;
    }
    return null;
  };

  const addFiles = useCallback((files: File[]) => {
    setUploads((prev) => {
      const next = [...prev];
      for (const f of files) {
        const err = validate(f);
        next.push({ file: f, progress: 0, error: err });
      }
      return next;
    });
    // Default bundle title from the first file.
    setBundleTitle((prev) => {
      if (prev) return prev;
      const first = files[0];
      return first ? first.name.replace(/\.[^.]+$/, "") : prev;
    });
  }, []);

  const onPick = useCallback(
    (filesOrFile: File | File[] | FileList) => {
      const arr =
        filesOrFile instanceof File
          ? [filesOrFile]
          : Array.from(filesOrFile as FileList | File[]);
      addFiles(arr);
    },
    [addFiles],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const fl = e.dataTransfer.files;
      if (fl && fl.length > 0) onPick(fl);
    },
    [onPick],
  );

  function removeUpload(idx: number) {
    setUploads((prev) => prev.filter((_, i) => i !== idx));
  }

  // Upload a single file via signed URL → Storage. Returns storage_path.
  async function uploadFile(
    idx: number,
    item: UploadState,
  ): Promise<{
    storage_path: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  }> {
    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        filename: item.file.name,
        mime_type: item.file.type,
        size: item.file.size,
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
        item.file.type || "application/octet-stream",
      );
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const p = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) =>
            prev.map((u, i) => (i === idx ? { ...u, progress: p } : u)),
          );
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload network error"));
      xhr.send(item.file);
    });

    return {
      storage_path: path,
      file_name: item.file.name,
      file_size: item.file.size,
      mime_type: item.file.type,
    };
  }

  const onSubmit = async () => {
    const valid = uploads.filter((u) => !u.error);
    if (valid.length === 0) return;
    setSubmitting(true);

    try {
      if (valid.length > 1 && groupMode === "bundle") {
        // Upload all, post a single markup with extra_assets.
        const results = await Promise.all(
          uploads.map(async (u, i) =>
            u.error ? null : uploadFile(i, u),
          ),
        );
        const okResults = results.filter(Boolean) as Array<{
          storage_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
        }>;
        if (okResults.length === 0) throw new Error("All uploads failed");
        const primary = okResults[0]!;
        const primaryFile = uploads.find((u) => !u.error)!.file;
        const primaryCategory = categoryFromFile(primaryFile);
        const primaryType = markupTypeForCategory(primaryCategory);
        const extras = okResults.slice(1).map((r) => {
          const cat = categoryFromMime(r.mime_type);
          const t = markupTypeForCategory(cat);
          // markupTypeForCategory returns image | pdf | website. The website
          // case shouldn't happen for uploaded files (websites come from URL
          // input), but be defensive: bundle anything non-image as pdf.
          const assetType: "image" | "pdf" = t === "image" ? "image" : "pdf";
          return { ...r, type: assetType };
        });

        const res = await fetch("/api/markups", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            folder_id: folderId,
            project_id: projectId ?? undefined,
            type: primaryType,
            title:
              bundleTitle.trim() ||
              primary.file_name.replace(/\.[^.]+$/, ""),
            file: primary,
            extra_assets: extras,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't create MarkUp");
        }
        const { id } = (await res.json()) as { id: string };
        toast.success(
          `MarkUp created with ${okResults.length} ${
            okResults.length === 1 ? "asset" : "assets"
          }`,
        );
        setUploads([]);
        onCreated(id);
        return;
      }

      // Single file OR separate-markups mode.
      let firstId: string | null = null;
      for (let i = 0; i < uploads.length; i++) {
        const u = uploads[i]!;
        if (u.error) continue;
        const meta = await uploadFile(i, u);
        const cat = categoryFromFile(u.file);
        const type = markupTypeForCategory(cat);
        const res = await fetch("/api/markups", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            folder_id: folderId,
            project_id: projectId ?? undefined,
            type,
            title: u.file.name.replace(/\.[^.]+$/, ""),
            file: meta,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Couldn't create MarkUp");
        }
        const { id } = (await res.json()) as { id: string };
        if (!firstId) firstId = id;
      }
      toast.success(
        `${uploads.length} ${uploads.length === 1 ? "MarkUp" : "MarkUps"} created`,
      );
      setUploads([]);
      if (firstId) onCreated(firstId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  function iconFor(file: File) {
    const mime = file.type;
    const cat = categoryFromFile(file);
    if (cat === "image") return ImageIcon;
    if (cat === "pdf") return FileText;
    if (cat === "text") return FileType;
    if (cat === "office") {
      if (mime.includes("spreadsheet") || mime.includes("excel"))
        return FileSpreadsheet;
      if (mime.includes("presentation") || mime.includes("powerpoint"))
        return Presentation;
      return FileText;
    }
    return FileText;
  }

  const hasErrors = uploads.some((u) => u.error);
  const validCount = uploads.filter((u) => !u.error).length;
  const showGroupChoice = uploads.length > 1 && !submitting;

  return (
    <div className="flex flex-col gap-5 pb-2">
      {uploads.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
            dragOver
              ? "border-primary bg-accent"
              : "border-border bg-muted/30 hover:bg-muted/60",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <UploadCloud className="size-5" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Drag &amp; drop or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Multiple files OK · PNG, JPG, PDF, DOCX, XLSX, PPTX, TXT · Max
              50 MB each
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_MIMES.join(",")}
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onPick(e.target.files);
              }
              e.target.value = "";
            }}
          />
        </button>
      ) : (
        <>
          {/* List of picked files */}
          <ul
            className="flex max-h-72 flex-col gap-2 overflow-y-auto"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {uploads.map((u, i) => {
              const Icon = iconFor(u.file);
              return (
                <li
                  key={`${u.file.name}-${i}`}
                  className="overflow-hidden rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p
                        className="truncate text-sm font-semibold text-foreground"
                        title={u.file.name}
                      >
                        {u.file.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {(u.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {u.error ? (
                        <div className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
                          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                          <span>{u.error}</span>
                        </div>
                      ) : submitting ? (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card">
                          <div
                            className="h-full bg-primary transition-[width]"
                            style={{ width: `${u.progress}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                    {!submitting ? (
                      <button
                        type="button"
                        onClick={() => removeUpload(i)}
                        aria-label={`Remove ${u.file.name}`}
                        className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground disabled:opacity-50"
              >
                + Add more files
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPTED_MIMES.join(",")}
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onPick(e.target.files);
                  }
                  e.target.value = "";
                }}
              />
            </li>
          </ul>

          {/* Group-mode choice for >1 files */}
          {showGroupChoice ? (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {uploads.length} files — what to do?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setGroupMode("bundle")}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    groupMode === "bundle"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-full border-2",
                        groupMode === "bundle"
                          ? "border-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {groupMode === "bundle" ? (
                        <span className="size-1.5 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      One MarkUp · {uploads.length} assets
                    </p>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-muted-foreground">
                    Switch between assets in the canvas. Comments stay
                    per-asset.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode("separate")}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    groupMode === "separate"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center rounded-full border-2",
                        groupMode === "separate"
                          ? "border-primary"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {groupMode === "separate" ? (
                        <span className="size-1.5 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {uploads.length} separate MarkUps
                    </p>
                  </div>
                  <p className="mt-1 pl-5 text-[11px] text-muted-foreground">
                    Each file becomes its own MarkUp on the dashboard.
                  </p>
                </button>
              </div>

              {groupMode === "bundle" ? (
                <div className="mt-3 grid gap-1.5">
                  <Label
                    htmlFor="bundle-title"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    MarkUp title
                  </Label>
                  <Input
                    id="bundle-title"
                    value={bundleTitle}
                    onChange={(e) => setBundleTitle(e.target.value)}
                    placeholder="Project alpha · review pack"
                    maxLength={120}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      <DialogFooter className="px-0 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={validCount === 0 || hasErrors || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading…
            </>
          ) : uploads.length > 1 && groupMode === "bundle" ? (
            `Create 1 MarkUp · ${validCount} assets`
          ) : uploads.length > 1 ? (
            `Create ${validCount} MarkUps`
          ) : (
            "Create MarkUp"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
