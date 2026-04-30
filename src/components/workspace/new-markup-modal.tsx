"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UploadCloud } from "lucide-react";
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
import { urlMarkupSchema, type UrlMarkupInput } from "@/lib/validations/markup";

interface NewMarkupModalProps {
  workspaceId: string;
  folderId?: string | null;
}

export function NewMarkupModal({ workspaceId, folderId = null }: NewMarkupModalProps) {
  const router = useRouter();
  const open = useUIStore((s) => s.newMarkupOpen);
  const tab = useUIStore((s) => s.newMarkupTab);
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);
  const [submittingFile, setSubmittingFile] = useState(false);

  const form = useForm<UrlMarkupInput>({
    resolver: zodResolver(urlMarkupSchema),
    defaultValues: { url: "", title: "" },
  });

  const onCreateUrl = form.handleSubmit(async (values) => {
    // Phase 8 wires Apify; for now persist a `website` MarkUp w/ source_url and
    // a placeholder until screenshot lands.
    const url = values.url.startsWith("http")
      ? values.url
      : `https://${values.url}`;
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
    toast.success("MarkUp created");
    setNewMarkupOpen(false);
    form.reset();
    router.push(`/w/${workspaceId}/markup/${id}`);
    router.refresh();
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => setNewMarkupOpen(o)}
    >
      <DialogContent className="max-w-[600px] gap-0 p-0">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="text-xl">New MarkUp</DialogTitle>
          <DialogDescription>
            Upload a file or paste a URL to start collecting feedback.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue={tab}
          onValueChange={(v) => setNewMarkupOpen(true, v as "url" | "file")}
          className="px-6 pt-4"
        >
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">Upload file</TabsTrigger>
            <TabsTrigger value="url" className="flex-1">Add URL</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="pt-5">
            <FileTabPlaceholder
              loading={submittingFile}
              setLoading={setSubmittingFile}
            />
          </TabsContent>

          <TabsContent value="url" className="pt-5">
            <form className="flex flex-col gap-5" onSubmit={onCreateUrl} noValidate>
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setNewMarkupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function FileTabPlaceholder({
  loading,
}: {
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <label
        htmlFor="markup-file"
        className="flex cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/40 p-10 text-center opacity-60"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-primary">
          <UploadCloud className="size-5" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            File upload — Phase 4
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Image + PDF upload (50MB cap, Supabase Storage) ships next phase.
            Use the URL tab for now.
          </p>
        </div>
      </label>
      <Button type="button" disabled={loading || true}>
        Choose file
      </Button>
    </div>
  );
}
