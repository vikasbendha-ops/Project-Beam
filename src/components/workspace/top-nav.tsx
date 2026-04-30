"use client";

import Link from "next/link";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BeamWordmark } from "@/components/shared/beam-mark";
import { useUIStore } from "@/stores/ui-store";

interface TopNavProps {
  workspaceId: string;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  unreadCount?: number;
}

export function TopNav({ workspaceId, user, unreadCount = 0 }: TopNavProps) {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <Link href={`/w/${workspaceId}`} className="md:hidden">
          <BeamWordmark className="text-xl" />
        </Link>
        <div className="relative hidden w-72 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search markups…"
            className="h-9 pl-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          asChild
          className="relative"
        >
          <Link href={`/w/${workspaceId}/notifications`}>
            <Bell className="size-5" strokeWidth={1.5} />
            {unreadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Help"
          className="hidden sm:inline-flex"
        >
          <HelpCircle className="size-5" strokeWidth={1.5} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
            <Avatar className="size-8 border border-border">
              {user.avatarUrl ? (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              ) : null}
              <AvatarFallback className="bg-accent text-xs font-bold text-accent-foreground">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="truncate text-sm font-semibold">
                {user.name}
              </span>
              <span className="truncate text-[11px] font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/w/${workspaceId}/settings`}>
                Workspace settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/w/${workspaceId}/people`}>People</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/api/auth/logout">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
