"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
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
import { cn } from "@/lib/utils";

const ACCEPTED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
] as const;
type AcceptedMime = (typeof ACCEPTED_MIMES)[number];

interface NewMarkupModalProps {
  workspaceId: string;
  folderId?: string | null;
}

export function NewMarkupModal({
  workspaceId,
  folderId = null,
}: NewMarkupModalProps) {
  const router = useRouter();
  const open = useUIStore((s) => s.newMarkupOpen);
  const tab = useUIStore((s) => s.newMarkupTab);
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);

  return (
    <Dialog open={open} onOpenChange={(o) => setNewMarkupOpen(o)}>
      <DialogContent className="max-w-[600px] gap-0 p-0">
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
  onCreated,
  onCancel,
}: {
  workspaceId: string;
  folderId: string | null;
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

function FileTab({
  workspaceId,
  folderId,
  onCreated,
  onCancel,
}: {
  workspaceId: string;
  folderId: string | null;
  onCreated: (id: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (f: File): string | null => {
    if (!ACCEPTED_MIMES.includes(f.type as AcceptedMime)) {
      return "Unsupported file type. Allowed: PNG, JPG, GIF, WEBP, SVG, PDF.";
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Max 50 MB.`;
    }
    return null;
  };

  const onPick = useCallback((file: File) => {
    const err = validate(file);
    setUpload({ file, progress: 0, error: err });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onPick(file);
    },
    [onPick],
  );

  const onSubmit = async () => {
    if (!upload || upload.error) return;
    setSubmitting(true);

    try {
      // Step 1: ask the server for a signed upload URL.
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          filename: upload.file.name,
          mime_type: upload.file.type,
          size: upload.file.size,
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

      // Step 2: PUT the file directly to Storage (XHR for progress).
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signed_url);
        xhr.setRequestHeader(
          "Content-Type",
          upload.file.type || "application/octet-stream",
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUpload((s) =>
              s ? { ...s, progress: Math.round((e.loaded / e.total) * 100) } : s,
            );
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Upload network error"));
        xhr.send(upload.file);
      });

      // Step 3: register the markup row.
      const type: "image" | "pdf" = upload.file.type === "application/pdf"
        ? "pdf"
        : "image";
      const res = await fetch("/api/markups", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspace_id: workspaceId,
          folder_id: folderId,
          type,
          title: upload.file.name.replace(/\.[^.]+$/, ""),
          file: {
            storage_path: path,
            file_size: upload.file.size,
            file_name: upload.file.name,
            mime_type: upload.file.type,
          },
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error ?? "Couldn't create MarkUp");
      }
      const { id } = (await res.json()) as { id: string };
      toast.success("MarkUp created");
      setUpload(null);
      onCreated(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
      setUpload((s) => (s ? { ...s, error: message } : s));
    } finally {
      setSubmitting(false);
    }
  };

  const FileIcon =
    upload?.file?.type === "application/pdf" ? FileText : ImageIcon;

  return (
    <div className="flex flex-col gap-5 pb-2">
      {!upload ? (
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
              PNG, JPG, GIF, WEBP, SVG, or PDF · Max 50 MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_MIMES.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = "";
            }}
          />
        </button>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
              <FileIcon className="size-5" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {upload.file.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {(upload.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {upload.error ? (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span>{upload.error}</span>
                </div>
              ) : submitting ? (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              ) : null}
            </div>
            {!submitting ? (
              <button
                type="button"
                onClick={() => setUpload(null)}
                aria-label="Remove file"
                className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      )}

      <DialogFooter className="px-0 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!upload || !!upload.error || submitting}
          onClick={onSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Uploading {upload?.progress ?? 0}%
            </>
          ) : (
            "Create MarkUp"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
