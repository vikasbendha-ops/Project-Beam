"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link as LinkIcon, Loader2, Send, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  markupId: string;
  markupTitle: string;
}

interface ShareLink {
  id: string;
  token: string;
  can_comment: boolean;
  is_active: boolean;
  expires_at: string | null;
}

export function ShareModal({
  open,
  onOpenChange,
  workspaceId,
  markupId,
  markupTitle,
}: ShareModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] gap-0 p-0">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle className="text-lg">Share &ldquo;{markupTitle}&rdquo;</DialogTitle>
          <DialogDescription>
            Send to people directly, or grab a public link.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="invite" className="px-6 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="invite" className="flex-1">
              <UserPlus className="size-3.5" />
              Invite people
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1">
              <LinkIcon className="size-3.5" />
              Share link
            </TabsTrigger>
          </TabsList>
          <TabsContent value="invite" className="pt-5">
            <InvitePanel
              workspaceId={workspaceId}
              markupId={markupId}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="link" className="pt-5">
            <LinkPanel markupId={markupId} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InvitePanel({
  workspaceId,
  markupId,
  onClose,
}: {
  workspaceId: string;
  markupId: string;
  onClose: () => void;
}) {
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<"guest" | "member">("guest");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function commitDraft() {
    const v = draft.trim().toLowerCase();
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error("Enter a valid email");
      return;
    }
    if (emails.includes(v)) {
      setDraft("");
      return;
    }
    setEmails((xs) => [...xs, v]);
    setDraft("");
  }

  async function handleSend() {
    if (draft.trim()) commitDraft();
    if (emails.length === 0) {
      toast.error("Add at least one email");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspaceId,
        emails,
        role,
        message: message.trim() || undefined,
        markup_id: role === "guest" ? markupId : undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't send invites");
      return;
    }
    const body = (await res.json()) as {
      sent: string[];
      failed: { email: string; error: string }[];
    };
    if (body.sent.length > 0)
      toast.success(`Invite sent to ${body.sent.length} ${body.sent.length === 1 ? "person" : "people"}`);
    if (body.failed.length > 0) {
      toast.error(
        `Failed for ${body.failed.length}: ${body.failed[0]?.error ?? "unknown"}`,
      );
    }
    setEmails([]);
    setMessage("");
    if (body.failed.length === 0) onClose();
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {emails.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm"
            >
              {e}
              <button
                type="button"
                onClick={() => setEmails((xs) => xs.filter((x) => x !== e))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${e}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                commitDraft();
              }
              if (e.key === "Backspace" && !draft && emails.length) {
                setEmails((xs) => xs.slice(0, -1));
              }
            }}
            onBlur={commitDraft}
            placeholder={
              emails.length === 0
                ? "Add emails (Enter to confirm)"
                : "More emails…"
            }
            className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "guest" | "member")}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="guest">Guest reviewer</option>
            <option value="member">Member</option>
          </select>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add an optional message…"
          rows={2}
          className="mt-3 w-full resize-none rounded-md border border-border bg-card p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          maxLength={500}
        />
      </div>
      <DialogFooter className="px-0">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSend} disabled={submitting}>
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Send invites
        </Button>
      </DialogFooter>
    </div>
  );
}

function LinkPanel({ markupId }: { markupId: string }) {
  const [link, setLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await fetch("/api/share-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markup_id: markupId, can_comment: true }),
      });
      if (cancelled) return;
      if (res.ok) {
        const body = (await res.json()) as ShareLink;
        setLink(body);
      } else {
        const { error } = await res.json().catch(() => ({}));
        toast.error(error ?? "Couldn't create share link");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [markupId]);

  const url = link
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${link.token}`
    : "";

  async function toggleCanComment(value: boolean) {
    if (!link) return;
    const prev = link.can_comment;
    setLink({ ...link, can_comment: value });
    const res = await fetch(`/api/share-links/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ can_comment: value }),
    });
    if (!res.ok) {
      setLink({ ...link, can_comment: prev });
      toast.error("Couldn't update");
    }
  }

  async function disable() {
    if (!link) return;
    if (!window.confirm("Disable this link? Existing reviewers lose access."))
      return;
    const res = await fetch(`/api/share-links/${link.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });
    if (!res.ok) {
      toast.error("Couldn't disable");
      return;
    }
    setLink(null);
    toast.success("Link disabled. A new one will be generated next time.");
  }

  function copy() {
    if (!url) return;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Generating link…
      </div>
    );
  }
  if (!link) {
    return (
      <p className="rounded-lg border border-border bg-muted p-3 text-xs text-muted-foreground">
        No link available. Close this dialog and re-open to create one.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Anyone with the link can comment
          </p>
          <p className="text-[11px] text-muted-foreground">
            Toggle off to make the link view-only.
          </p>
        </div>
        <Switch
          checked={link.can_comment}
          onCheckedChange={toggleCanComment}
        />
      </div>
      <div className="flex gap-2">
        <Input value={url} readOnly className="font-mono text-xs" />
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <button
        type="button"
        onClick={disable}
        className={cn(
          "self-start text-xs font-semibold text-muted-foreground transition-colors hover:text-destructive",
        )}
      >
        Disable link
      </button>
    </div>
  );
}
