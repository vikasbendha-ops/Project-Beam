"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AtSign,
  CheckCheck,
  CheckCircle2,
  CornerDownRight,
  Globe,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type Profile = { id: string; name: string; avatar_url: string | null };
type MarkupSummary = { id: string; title: string };

interface NotificationCenterProps {
  notifications: Notification[];
  profiles: Profile[];
  markups: MarkupSummary[];
  workspaceId: string;
}

const ICONS: Record<Notification["type"], React.ComponentType<{ className?: string }>> = {
  comment: MessageSquare,
  mention: AtSign,
  reply: CornerDownRight,
  resolve: CheckCircle2,
  status_change: Zap,
  share: Globe,
  invite: UserPlus,
  approve: ShieldCheck,
};

export function NotificationCenter({
  notifications,
  profiles,
  markups,
  workspaceId,
}: NotificationCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [working, setWorking] = useState(false);

  const profileMap = useMemo(() => {
    const m: Record<string, Profile> = {};
    profiles.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [profiles]);
  const markupMap = useMemo(() => {
    const m: Record<string, MarkupSummary> = {};
    markups.forEach((p) => {
      m[p.id] = p;
    });
    return m;
  }, [markups]);

  const visible = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [filter, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    if (unreadCount === 0) return;
    setWorking(true);
    const res = await fetch("/api/notifications/read-all", {
      method: "POST",
    });
    setWorking(false);
    if (!res.ok) {
      toast.error("Couldn't mark all read");
      return;
    }
    router.refresh();
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {unreadCount}
                </span>{" "}
                unread
              </>
            ) : (
              "You're caught up."
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-border bg-card p-1">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={working || unreadCount === 0}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">
            Nothing new here.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Mentions, replies, resolves, and approvals will land here in
            realtime.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {visible.map((n) => {
            const Icon = ICONS[n.type] ?? MessageSquare;
            const triggererName =
              (n.triggered_by && profileMap[n.triggered_by]?.name) ||
              n.triggered_by_guest_name ||
              "Someone";
            const triggerer = n.triggered_by
              ? profileMap[n.triggered_by]
              : null;
            const initials = triggererName
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const markupTitle = n.markup_id
              ? markupMap[n.markup_id]?.title ?? "MarkUp"
              : "MarkUp";
            const time = n.created_at
              ? formatDistanceToNow(new Date(n.created_at), {
                  addSuffix: true,
                })
              : "";
            const href = n.markup_id
              ? `/w/${workspaceId}/markup/${n.markup_id}`
              : `/w/${workspaceId}`;

            return (
              <li
                key={n.id}
                className={cn(
                  "group relative",
                  !n.read && "bg-accent/30",
                )}
              >
                <Link
                  href={href}
                  onClick={() => {
                    if (!n.read) void markRead(n.id);
                  }}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5"
                >
                  {!n.read ? (
                    <span
                      className="mt-2 size-2 shrink-0 rounded-full bg-primary"
                      aria-label="Unread"
                    />
                  ) : (
                    <span className="mt-2 size-2 shrink-0" />
                  )}
                  <Avatar className="size-9 shrink-0 border border-border">
                    {triggerer?.avatar_url ? (
                      <AvatarImage
                        src={triggerer.avatar_url}
                        alt={triggererName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
                      {initials || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{triggererName}</span>{" "}
                      <NotificationVerb type={n.type} />{" "}
                      <span className="font-medium text-foreground">
                        {markupTitle}
                      </span>
                    </p>
                    {n.content_preview ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.content_preview}
                      </p>
                    ) : null}
                    <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                      <Icon className="size-3" /> {time}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NotificationVerb({ type }: { type: Notification["type"] }) {
  const verb: Record<Notification["type"], string> = {
    comment: "left a comment on",
    mention: "mentioned you on",
    reply: "replied on",
    resolve: "resolved a thread on",
    status_change: "updated the status of",
    share: "shared",
    invite: "invited you to",
    approve: "approved",
  };
  return <span className="text-muted-foreground">{verb[type]}</span>;
}
