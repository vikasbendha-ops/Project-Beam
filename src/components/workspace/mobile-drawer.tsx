"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/workspace/sidebar";
import type { FolderNode } from "@/components/workspace/folder-tree";
import type { WorkspaceSummary } from "@/components/workspace/workspace-switcher";
import { useUIStore } from "@/stores/ui-store";

interface MobileDrawerProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  folders?: FolderNode[];
}

export function MobileDrawer({
  current,
  workspaces,
  folders = [],
}: MobileDrawerProps) {
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
          folders={folders}
          className="w-full border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
}
