"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewWorkspaceModal({ open, onClose }: NewWorkspaceModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      setName("");
    });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't create workspace");
      return;
    }
    const json = (await res.json()) as { redirect: string };
    toast.success("Workspace created");
    onClose();
    router.push(json.redirect);
    router.refresh();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              New workspace
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A separate space for a team or client. You can invite people
              after.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </header>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ws-create-name">Workspace name</Label>
            <Input
              id="ws-create-name"
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme team"
              maxLength={80}
              disabled={busy}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Create workspace
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
