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
  LayoutList,
  List,
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

const ICONS: Record<
  Notification["type"],
  React.ComponentType<{ className?: string }>
> = {
  comment: MessageSquare,
  mention: AtSign,
  reply: CornerDownRight,
  resolve: CheckCircle2,
  status_change: Zap,
  share: Globe,
  invite: UserPlus,
  approve: ShieldCheck,
};

/** Pill colors keyed by type so each row's icon picks up a tinted bg. */
const TYPE_TINT: Record<Notification["type"], string> = {
  comment: "bg-sky-100 text-sky-700",
  mention: "bg-violet-100 text-violet-700",
  reply: "bg-sky-100 text-sky-700",
  resolve: "bg-emerald-100 text-emerald-700",
  status_change: "bg-amber-100 text-amber-700",
  share: "bg-indigo-100 text-indigo-700",
  invite: "bg-pink-100 text-pink-700",
  approve: "bg-emerald-100 text-emerald-700",
};

type FilterKey = "all" | "mentions" | "comments" | "status" | "shares";

const FILTER_TO_TYPES: Record<FilterKey, Notification["type"][] | null> = {
  all: null,
  mentions: ["mention"],
  comments: ["comment", "reply"],
  status: ["status_change", "approve", "resolve"],
  shares: ["share", "invite"],
};

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All",
  mentions: "Mentions",
  comments: "Comments",
  status: "Status",
  shares: "Shares",
};

export function NotificationCenter({
  notifications,
  profiles,
  markups,
  workspaceId,
}: NotificationCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [grouped, setGrouped] = useState(false);
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

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: notifications.length,
      mentions: 0,
      comments: 0,
      status: 0,
      shares: 0,
    };
    for (const n of notifications) {
      if ((["mention"] as Notification["type"][]).includes(n.type))
        c.mentions += 1;
      if ((["comment", "reply"] as Notification["type"][]).includes(n.type))
        c.comments += 1;
      if (
        (
          ["status_change", "approve", "resolve"] as Notification["type"][]
        ).includes(n.type)
      )
        c.status += 1;
      if ((["share", "invite"] as Notification["type"][]).includes(n.type))
        c.shares += 1;
    }
    return c;
  }, [notifications]);

  const visible = useMemo(() => {
    let list = notifications;
    const typeAllow = FILTER_TO_TYPES[filter];
    if (typeAllow) list = list.filter((n) => typeAllow.includes(n.type));
    if (unreadOnly) list = list.filter((n) => !n.read);
    return list;
  }, [notifications, filter, unreadOnly]);

  // Grouping by markup_id (workspace-level events with no markup go under
  // a "Workspace" bucket).
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; rows: Notification[] }>();
    for (const n of visible) {
      const key = n.markup_id ?? "__workspace__";
      const title =
        n.markup_id != null
          ? markupMap[n.markup_id]?.title ?? "MarkUp"
          : "Workspace";
      const bucket = map.get(key) ?? { title, rows: [] };
      bucket.rows.push(n);
      map.set(key, bucket);
    }
    // Sort groups by most recent activity desc.
    return Array.from(map.entries())
      .map(([key, bucket]) => ({
        key,
        title: bucket.title,
        rows: bucket.rows,
        latest: bucket.rows[0]?.created_at ?? "",
        unread: bucket.rows.filter((n) => !n.read).length,
      }))
      .sort((a, b) => (a.latest < b.latest ? 1 : -1));
  }, [visible, markupMap]);

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
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
          <Button
            type="button"
            variant={grouped ? "default" : "ghost"}
            size="sm"
            onClick={() => setGrouped((v) => !v)}
            aria-pressed={grouped}
            title={grouped ? "Switch to flat list" : "Group by MarkUp"}
          >
            {grouped ? (
              <LayoutList className="size-4" />
            ) : (
              <List className="size-4" />
            )}
            {grouped ? "Grouped" : "Group"}
          </Button>
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

      {/* Filter pills + unread toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(Object.keys(FILTER_LABEL) as FilterKey[]).map((f) => {
          const active = f === filter;
          const count = counts[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {FILTER_LABEL[f]}
              <span
                className={cn(
                  "tabular-nums",
                  active
                    ? "text-background/80"
                    : "text-muted-foreground/70",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        <span className="mx-1 hidden h-5 w-px bg-border sm:inline-block" />
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
            unreadOnly
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              unreadOnly ? "bg-primary-foreground" : "bg-primary",
            )}
          />
          Unread only
          <span
            className={cn(
              "tabular-nums",
              unreadOnly
                ? "text-primary-foreground/80"
                : "text-muted-foreground/70",
            )}
          >
            {unreadCount}
          </span>
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">
            Nothing here.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {unreadOnly
              ? "All caught up. Try clearing the unread filter."
              : "Try a different filter — or wait for new activity."}
          </p>
        </div>
      ) : grouped ? (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <NotificationGroup
              key={group.key}
              title={group.title}
              unreadCount={group.unread}
              rows={group.rows}
              workspaceId={workspaceId}
              profileMap={profileMap}
              markupMap={markupMap}
              onMarkRead={markRead}
            />
          ))}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          {visible.map((n) => (
            <NotificationRow
              key={n.id}
              notification={n}
              workspaceId={workspaceId}
              profileMap={profileMap}
              markupMap={markupMap}
              onMarkRead={markRead}
              showMarkupTitle
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------- Group + Row sub-components -------- */

function NotificationGroup({
  title,
  unreadCount,
  rows,
  workspaceId,
  profileMap,
  markupMap,
  onMarkRead,
}: {
  title: string;
  unreadCount: number;
  rows: Notification[];
  workspaceId: string;
  profileMap: Record<string, Profile>;
  markupMap: Record<string, MarkupSummary>;
  onMarkRead: (id: string) => void;
}) {
  const headHref = rows[0]?.markup_id
    ? `/w/${workspaceId}/markup/${rows[0].markup_id}`
    : `/w/${workspaceId}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5 sm:px-5">
        <Link
          href={headHref}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
        >
          {title}
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
            {rows.length}
          </span>
        </Link>
        {unreadCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {unreadCount} new
          </span>
        ) : null}
      </header>
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((n) => (
          <NotificationRow
            key={n.id}
            notification={n}
            workspaceId={workspaceId}
            profileMap={profileMap}
            markupMap={markupMap}
            onMarkRead={onMarkRead}
            showMarkupTitle={false}
          />
        ))}
      </ul>
    </div>
  );
}

function NotificationRow({
  notification: n,
  workspaceId,
  profileMap,
  markupMap,
  onMarkRead,
  showMarkupTitle,
}: {
  notification: Notification;
  workspaceId: string;
  profileMap: Record<string, Profile>;
  markupMap: Record<string, MarkupSummary>;
  onMarkRead: (id: string) => void;
  showMarkupTitle: boolean;
}) {
  const Icon = ICONS[n.type] ?? MessageSquare;
  const triggererName =
    (n.triggered_by && profileMap[n.triggered_by]?.name) ||
    n.triggered_by_guest_name ||
    "Someone";
  const triggerer = n.triggered_by ? profileMap[n.triggered_by] : null;
  const initials = triggererName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const markupTitle = n.markup_id
    ? markupMap[n.markup_id]?.title ?? "MarkUp"
    : "Workspace";
  const time = n.created_at
    ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
    : "";
  const href = n.markup_id
    ? `/w/${workspaceId}/markup/${n.markup_id}`
    : `/w/${workspaceId}`;

  return (
    <li className={cn("relative", !n.read && "bg-accent/30")}>
      <Link
        href={href}
        onClick={() => {
          if (!n.read) onMarkRead(n.id);
        }}
        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5"
      >
        {!n.read ? (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-primary"
            aria-label="Unread"
          />
        ) : (
          <span className="mt-2 size-2 shrink-0" />
        )}
        <div className="relative">
          <Avatar className="size-9 shrink-0 border border-border">
            {triggerer?.avatar_url ? (
              <AvatarImage src={triggerer.avatar_url} alt={triggererName} />
            ) : null}
            <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
          <span
            className={cn(
              "absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-2 ring-card",
              TYPE_TINT[n.type],
            )}
            aria-hidden
          >
            <Icon className="size-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{triggererName}</span>{" "}
            <NotificationVerb type={n.type} />
            {showMarkupTitle ? (
              <>
                {" "}
                <span className="font-medium text-foreground">
                  {markupTitle}
                </span>
              </>
            ) : null}
          </p>
          {n.content_preview ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {n.content_preview}
            </p>
          ) : null}
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {time}
          </p>
        </div>
      </Link>
    </li>
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
