"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AtSign,
  CheckCircle2,
  CornerDownRight,
  Globe,
  History,
  Loader2,
  MessageSquare,
  ShieldCheck,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type ActivityType = Database["public"]["Enums"]["notification_type"];

interface ActivityRow {
  id: string;
  type: ActivityType;
  content_preview: string | null;
  created_at: string | null;
  triggered_by: string | null;
  triggered_by_guest_name: string | null;
}
interface ActivityProfile {
  id: string;
  name: string;
  avatar_url: string | null;
}

const ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> =
  {
    comment: MessageSquare,
    mention: AtSign,
    reply: CornerDownRight,
    resolve: CheckCircle2,
    status_change: Zap,
    share: Globe,
    invite: UserPlus,
    approve: ShieldCheck,
  };

const TINT: Record<ActivityType, string> = {
  comment: "bg-sky-100 text-sky-700",
  mention: "bg-violet-100 text-violet-700",
  reply: "bg-sky-100 text-sky-700",
  resolve: "bg-emerald-100 text-emerald-700",
  status_change: "bg-amber-100 text-amber-700",
  share: "bg-indigo-100 text-indigo-700",
  invite: "bg-pink-100 text-pink-700",
  approve: "bg-emerald-100 text-emerald-700",
};

const VERB: Record<ActivityType, string> = {
  comment: "commented",
  mention: "mentioned someone",
  reply: "replied",
  resolve: "resolved a thread",
  status_change: "changed status",
  share: "shared the MarkUp",
  invite: "invited a teammate",
  approve: "approved",
};

interface ActivityDrawerProps {
  markupId: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Slide-in right drawer showing the markup's full audit timeline.
 *
 * Reuses the existing `notifications` table — every status change, share,
 * approve, mention, and comment dispatch already lands there with a
 * `markup_id`. The /api/markups/[id]/activity endpoint enforces
 * membership and joins the triggerer profile.
 */
export function ActivityDrawer({
  markupId,
  open,
  onClose,
}: ActivityDrawerProps) {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [profiles, setProfiles] = useState<ActivityProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Single fetch fn so the realtime subscription + the open-effect share
  // logic.
  const refetch = useCallback(async () => {
    try {
      const res = await fetch(`/api/markups/${markupId}/activity`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        rows: ActivityRow[];
        profiles: ActivityProfile[];
      };
      setRows(json.rows);
      setProfiles(json.profiles);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [markupId]);

  // Lazy-load on first open + refetch when re-opened (cheap, last 80 rows).
  useEffect(() => {
    if (!open) return;
    void refetch();
  }, [open, refetch]);

  // While open, subscribe to notifications inserts on this markup so the
  // feed updates live as actions happen elsewhere.
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`activity:${markupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `markup_id=eq.${markupId}`,
        },
        () => {
          // Cheapest path: refetch the full last-80 list. The endpoint joins
          // profile + markup name for us.
          void refetch();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, markupId, refetch]);

  // Esc close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const profileMap: Record<string, ActivityProfile> = {};
  profiles.forEach((p) => {
    profileMap[p.id] = p;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="Activity log"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-bold tracking-tight text-foreground">
                Activity
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Last 80 events for this MarkUp.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {error ? (
            <div className="px-4 py-12 text-center text-sm text-destructive">
              {error}
            </div>
          ) : rows == null ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-muted-foreground">
              No activity yet. Comments, status changes, and shares show up
              here.
            </div>
          ) : (
            <ul className="relative space-y-1">
              {/* Vertical timeline rail behind the avatars */}
              <span
                aria-hidden
                className="absolute left-7 top-3 bottom-3 w-px bg-border"
              />
              {rows.map((r) => (
                <ActivityItem
                  key={r.id}
                  row={r}
                  profile={
                    r.triggered_by ? profileMap[r.triggered_by] : undefined
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function ActivityItem({
  row,
  profile,
}: {
  row: ActivityRow;
  profile?: ActivityProfile;
}) {
  const Icon = ICONS[row.type] ?? MessageSquare;
  const name =
    profile?.name || row.triggered_by_guest_name || "Someone";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const time = row.created_at
    ? formatDistanceToNow(new Date(row.created_at), { addSuffix: true })
    : "";
  return (
    <li className="relative flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/40">
      <div className="relative">
        <Avatar className="size-8 shrink-0 border border-border">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={name} />
          ) : null}
          <AvatarFallback className="bg-accent text-[10px] font-bold text-accent-foreground">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full ring-2 ring-card",
            TINT[row.type],
          )}
          aria-hidden
        >
          <Icon className="size-2.5" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{name}</span>{" "}
          <span className="text-muted-foreground">{VERB[row.type]}</span>
        </p>
        {row.content_preview ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
            {row.content_preview}
          </p>
        ) : null}
        <p className="mt-1 text-[10px] font-medium text-muted-foreground/80">
          {time}
        </p>
      </div>
    </li>
  );
}
