"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function NewMarkupButton({ className }: { className?: string }) {
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);
  return (
    <Button
      type="button"
      onClick={() => setNewMarkupOpen(true)}
      className={cn("gap-1.5", className)}
    >
      <Plus className="size-4" strokeWidth={2} />
      New MarkUp
    </Button>
  );
}
