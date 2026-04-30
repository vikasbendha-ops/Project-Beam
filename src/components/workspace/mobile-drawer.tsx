"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/workspace/sidebar";
import type { WorkspaceSummary } from "@/components/workspace/workspace-switcher";
import { useUIStore } from "@/stores/ui-store";

interface MobileDrawerProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
}

export function MobileDrawer({ current, workspaces }: MobileDrawerProps) {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="left"
        className="w-[280px] border-r border-border bg-muted p-0"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Workspace navigation</SheetTitle>
        </SheetHeader>
        <Sidebar
          current={current}
          workspaces={workspaces}
          className="w-full border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
}
