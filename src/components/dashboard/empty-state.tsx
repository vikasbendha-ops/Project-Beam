"use client";

import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";

export function DashboardEmptyState() {
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <FilePlus2 className="size-6" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold text-foreground">No markups yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Drop in your first image, PDF, or website URL to start collecting
        feedback. You can share the link with anyone — no signup required.
      </p>
      <Button
        type="button"
        className="mt-6"
        onClick={() => setNewMarkupOpen(true)}
      >
        Create your first MarkUp
      </Button>
    </div>
  );
}
