"use client";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ComposerMember {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}

export interface ComposerAttachment {
  url: string;
  filename: string;
  size: number;
  mime_type: string;
}

export interface ComposerSubmit {
  content: string;
  mentions: string[];
  attachments: ComposerAttachment[];
}

interface ComposerProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (payload: ComposerSubmit) => Promise<void>;
  autoFocus?: boolean;
  className?: string;
  /** Submit on Enter (Shift+Enter inserts newline). */
  submitOnEnter?: boolean;
  /** Workspace members for @-mention typeahead. */
  members?: ComposerMember[];
  /** Workspace id for signed-upload paths. Required to enable attachments. */
  workspaceId?: string;
}

const ATTACHMENT_LIMIT = 4;

export function Composer({
  placeholder = "Add a comment…",
  submitLabel = "Post",
  onSubmit,
  autoFocus = false,
  className,
  submitOnEnter = true,
  members = [],
  workspaceId,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const [uploading, setUploading] = useState(0);

  // @-mention state
  const [mentionMatches, setMentionMatches] = useState<ComposerMember[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionAt, setMentionAt] = useState<number | null>(null);
  const [confirmedMentions, setConfirmedMentions] = useState<string[]>([]);

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at < 0) return null;
    const between = before.slice(at + 1);
    if (between.includes(" ") || between.includes("\n")) return null;
    return { at, q: between.toLowerCase() };
  }

  function onContentChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setContent(next);
    const caret = e.target.selectionStart ?? next.length;
    const m = detectMention(next, caret);
    // Always show the popover when @ is detected — even with zero members —
    // so the user gets a clear "mentions are workspace-only" hint instead
    // of silent nothing.
    if (!m) {
      setMentionAt(null);
      setMentionMatches([]);
      return;
    }
    const matches = members
      .filter(
        (mb) =>
          mb.name.toLowerCase().includes(m.q) ||
          mb.email.toLowerCase().includes(m.q),
      )
      .slice(0, 6);
    setMentionAt(m.at);
    setMentionMatches(matches);
    setMentionIndex(0);
  }

  function pickMention(member: ComposerMember) {
    if (mentionAt == null) return;
    const before = content.slice(0, mentionAt);
    const after = content.slice(
      (textareaRef.current?.selectionStart ?? content.length),
    );
    const handle = member.name.replace(/\s+/g, "");
    const next = `${before}@${handle} ${after}`;
    setContent(next);
    setConfirmedMentions((prev) =>
      prev.includes(member.id) ? prev : [...prev, member.id],
    );
    setMentionAt(null);
    setMentionMatches([]);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const caret = before.length + handle.length + 2;
      ta.focus();
      ta.setSelectionRange(caret, caret);
    });
  }

  function clearAttachment(idx: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadFiles(files: FileList | File[]) {
    if (!workspaceId) {
      toast.error("Attachments unavailable here.");
      return;
    }
    const arr = Array.from(files);
    if (attachments.length + arr.length > ATTACHMENT_LIMIT) {
      toast.error(`Up to ${ATTACHMENT_LIMIT} attachments per message.`);
      return;
    }
    setUploading((n) => n + arr.length);
    for (const file of arr) {
      try {
        const res = await fetch("/api/upload/attachment", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            workspace_id: workspaceId,
            filename: file.name,
            mime_type: file.type || "application/octet-stream",
            size: file.size,
          }),
        });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error ?? "Sign failed");
        }
        const sig = (await res.json()) as {
          signed_url: string;
          read_url: string | null;
          path: string;
        };
        const put = await fetch(sig.signed_url, {
          method: "PUT",
          headers: {
            "content-type": file.type || "application/octet-stream",
          },
          body: file,
        });
        if (!put.ok) throw new Error(`Upload HTTP ${put.status}`);
        setAttachments((prev) => [
          ...prev,
          {
            url: sig.read_url ?? sig.path,
            filename: file.name,
            size: file.size,
            mime_type: file.type || "application/octet-stream",
          },
        ]);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : `Couldn't upload ${file.name}`,
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function handleSubmit() {
    const value = content.trim();
    if ((!value && attachments.length === 0) || submitting || uploading > 0)
      return;
    setSubmitting(true);
    try {
      // Resolve final mention list — drop ones whose handle no longer appears
      // in the text (user typed @alice then deleted it).
      const stillMentioned = confirmedMentions.filter((id) => {
        const m = members.find((mb) => mb.id === id);
        if (!m) return false;
        const handle = m.name.replace(/\s+/g, "");
        return value.includes(`@${handle}`);
      });
      await onSubmit({
        content: value,
        mentions: stillMentioned,
        attachments,
      });
      setContent("");
      setAttachments([]);
      setConfirmedMentions([]);
      setMentionAt(null);
      setMentionMatches([]);
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionAt != null && mentionMatches.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionMatches.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex(
          (i) => (i - 1 + mentionMatches.length) % mentionMatches.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickMention(mentionMatches[mentionIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionAt(null);
        setMentionMatches([]);
        return;
      }
    }
    if (submitOnEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  // Paste from clipboard → upload as attachment if it's a file (image paste).
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (!workspaceId) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length === 0) return;
      e.preventDefault();
      void uploadFiles(files);
    }
    const ta = textareaRef.current;
    ta?.addEventListener("paste", onPaste);
    return () => ta?.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  return (
    <div
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
        className,
      )}
      onDragOver={(e) => {
        if (workspaceId) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!workspaceId) return;
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
          void uploadFiles(e.dataTransfer.files);
        }
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={onContentChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        autoFocus={autoFocus}
        className="resize-none border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        maxLength={4000}
        disabled={submitting}
      />

      {attachments.length > 0 || uploading > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]"
            >
              {a.mime_type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.url}
                  alt=""
                  className="size-5 rounded object-cover"
                />
              ) : (
                <Paperclip className="size-3 text-muted-foreground" />
              )}
              <span className="max-w-[140px] truncate text-foreground">
                {a.filename}
              </span>
              <button
                type="button"
                onClick={() => clearAttachment(i)}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={`Remove ${a.filename}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li
              key={`up-${i}`}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
            >
              <Loader2 className="size-3 animate-spin" />
              Uploading…
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {workspaceId ? (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={submitting || attachments.length >= ATTACHMENT_LIMIT}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                aria-label="Attach file"
              >
                <Paperclip className="size-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) void uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </>
          ) : null}
          <span className="text-[10px] font-medium text-muted-foreground">
            ⏎ to send · ⇧⏎ for newline
            {members.length > 0 ? " · @ to mention" : ""}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={
            (!content.trim() && attachments.length === 0) ||
            submitting ||
            uploading > 0
          }
        >
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {submitLabel}
        </Button>
      </div>

      {mentionAt != null && mentionMatches.length === 0 ? (
        <div className="absolute bottom-[calc(100%+4px)] left-3 z-20 w-72 overflow-hidden rounded-lg border border-border bg-card p-3 text-xs shadow-lg">
          <p className="font-semibold text-foreground">No matching members</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">
            Mentions only fire for workspace members.{" "}
            <span className="text-foreground">
              Invite someone first
            </span>{" "}
            from{" "}
            <span className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
              People → Invite
            </span>{" "}
            and they&rsquo;ll appear here.
          </p>
        </div>
      ) : null}
      {mentionAt != null && mentionMatches.length > 0 ? (
        <div className="absolute bottom-[calc(100%+4px)] left-3 z-20 w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <ul role="listbox" className="max-h-56 overflow-auto py-1">
            {mentionMatches.map((m, i) => (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === mentionIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMention(m);
                  }}
                  onMouseEnter={() => setMentionIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs",
                    i === mentionIndex
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold uppercase text-primary">
                    {m.name.slice(0, 1)}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                    {m.name}
                  </span>
                  <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                    {m.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
