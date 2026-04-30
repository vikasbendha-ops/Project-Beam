"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  FolderOpen,
  Settings,
  Star,
  Users,
} from "lucide-react";
import {
  WorkspaceSwitcher,
  type WorkspaceSummary,
} from "@/components/workspace/workspace-switcher";
import { cn } from "@/lib/utils";

interface SidebarProps {
  current: WorkspaceSummary;
  workspaces: WorkspaceSummary[];
  className?: string;
}

export function Sidebar({ current, workspaces, className }: SidebarProps) {
  const base = `/w/${current.id}`;
  const pathname = usePathname();

  const items = [
    { href: base, label: "All Projects", icon: FolderOpen, exact: true },
    {
      href: `${base}?filter=shared`,
      label: "Shared with me",
      icon: Users,
      match: () => pathname === base,
      exact: false,
    },
    {
      href: `${base}?filter=favorites`,
      label: "Favorites",
      icon: Star,
      exact: false,
    },
    {
      href: `${base}?filter=archive`,
      label: "Archive",
      icon: Archive,
      exact: false,
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-muted",
        className,
      )}
    >
      <div className="border-b border-border p-3">
        <WorkspaceSwitcher current={current} workspaces={workspaces} />
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href.split("?")[0]
            : false;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-auto border-t border-border pt-3">
          <Link
            href={`${base}/settings`}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card/60 hover:text-foreground"
          >
            <Settings className="size-4" strokeWidth={1.5} />
            Workspace settings
          </Link>
        </div>
      </nav>
    </aside>
  );
}
