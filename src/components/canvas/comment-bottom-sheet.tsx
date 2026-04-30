"use client";

import { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { MessageSquare } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";
import type {
  CanvasCurrentUser,
  CanvasProfile,
  CanvasThread,
} from "@/components/canvas/types";
import { CommentPanel } from "@/components/canvas/comment-panel";
import { Button } from "@/components/ui/button";

interface CommentBottomSheetProps {
  threads: CanvasThread[];
  profiles: Record<string, CanvasProfile>;
  currentUser: CanvasCurrentUser;
  markupId: string;
}

export function CommentBottomSheet(props: CommentBottomSheetProps) {
  const activeThreadId = useCanvasStore((s) => s.activeThreadId);
  const [open, setOpen] = useState(false);

  // Auto-open when a thread becomes active (e.g., user tapped a pin).
  useEffect(() => {
    if (activeThreadId) setOpen(true);
  }, [activeThreadId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg active:scale-95"
      >
        <MessageSquare className="size-4" />
        {props.threads.length} comments
      </button>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-foreground/40" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border-t border-border bg-card outline-none">
            <Drawer.Title className="sr-only">Comments</Drawer.Title>
            <div className="mx-auto my-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
            <div className="min-h-[60vh] flex-1 overflow-hidden">
              <CommentPanel
                {...props}
                className="h-full w-full border-r-0"
              />
            </div>
            <div className="border-t border-border p-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
