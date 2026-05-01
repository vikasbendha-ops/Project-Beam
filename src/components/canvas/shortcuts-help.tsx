"use client";

import { useEffect, useState } from "react";
import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Group {
  title: string;
  rows: Array<{ keys: string[]; label: string }>;
}

interface ShortcutsHelpProps {
  /** True when the user has member/owner role (controls which shortcuts are
   * shown). Guests still get the comment/navigation rows. */
  canApprove: boolean;
}

export function ShortcutsHelp({ canApprove }: ShortcutsHelpProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        )
          return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups: Group[] = [
    {
      title: "Mode",
      rows: [
        { keys: ["C"], label: "Comment mode" },
        { keys: ["B"], label: "Browse mode" },
      ],
    },
    {
      title: "Navigation",
      rows: [
        { keys: ["←", "["], label: "Previous MarkUp" },
        { keys: ["→", "]"], label: "Next MarkUp" },
        { keys: ["?"], label: "Toggle this help" },
      ],
    },
  ];

  if (canApprove) {
    groups.push({
      title: "Status",
      rows: [
        { keys: ["A"], label: "Approve" },
        { keys: ["R"], label: "Request changes" },
        { keys: ["Y"], label: "Mark ready for review" },
        { keys: ["D"], label: "Mark as draft" },
      ],
    });
  }

  groups.push({
    title: "Canvas",
    rows: [
      { keys: ["⌘", "Wheel"], label: "Zoom (cursor-anchored)" },
      { keys: ["Space", "Drag"], label: "Pan" },
      { keys: ["Middle Click"], label: "Pan" },
    ],
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Press <Kbd>?</Kbd> any time to open this list.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g.title}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {g.rows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{r.label}</span>
                    <span className="flex items-center gap-1">
                      {r.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          {i > 0 ? (
                            <span className="text-[10px] text-muted-foreground">
                              or
                            </span>
                          ) : null}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}
