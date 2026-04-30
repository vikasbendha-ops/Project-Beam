"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComposerProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (content: string) => Promise<void>;
  autoFocus?: boolean;
  className?: string;
  /** Submit on Enter (Shift+Enter inserts newline). */
  submitOnEnter?: boolean;
}

export function Composer({
  placeholder = "Add a comment…",
  submitLabel = "Post",
  onSubmit,
  autoFocus = false,
  className,
  submitOnEnter = true,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const value = content.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(value);
      setContent("");
      textareaRef.current?.focus();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't post");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (submitOnEnter && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        autoFocus={autoFocus}
        className="resize-none border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        maxLength={4000}
        disabled={submitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          ⏎ to send · ⇧⏎ for newline
        </span>
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
