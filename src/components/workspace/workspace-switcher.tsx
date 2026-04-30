"use client";

import Link from "next/link";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface WorkspaceSummary {
  id: string;
  name: string;
  is_personal: boolean;
  initials?: string;
}

interface WorkspaceSwitcherProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
}

export function WorkspaceSwitcher({
  current,
  workspaces,
}: WorkspaceSwitcherProps) {
  const owned = workspaces.filter((w) => !current.is_personal || w.id === current.id || !w.is_personal);
  const shared = workspaces.filter((w) => w.is_personal && w.id !== current.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          {current.initials ?? current.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {current.name}
          </p>
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {current.is_personal ? "Personal" : "Team"}
          </p>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your workspaces
        </DropdownMenuLabel>
        {owned.map((w) => (
          <WorkspaceItem
            key={w.id}
            workspace={w}
            currentId={current.id}
          />
        ))}
        {shared.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Shared with you
            </DropdownMenuLabel>
            {shared.map((w) => (
              <WorkspaceItem
                key={w.id}
                workspace={w}
                currentId={current.id}
              />
            ))}
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/welcome" className="flex items-center gap-2">
            <Plus className="size-4" />
            New MarkUp
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WorkspaceItem({
  workspace,
  currentId,
}: {
  workspace: WorkspaceSummary;
  currentId: string;
}) {
  const isCurrent = workspace.id === currentId;
  return (
    <DropdownMenuItem asChild>
      <Link
        href={`/w/${workspace.id}`}
        className={cn(
          "flex items-center gap-2.5",
          isCurrent && "bg-accent",
        )}
      >
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground">
          {workspace.initials ?? workspace.name.slice(0, 2).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-sm">{workspace.name}</span>
        {isCurrent ? <Check className="size-4 text-primary" /> : null}
      </Link>
    </DropdownMenuItem>
  );
}
