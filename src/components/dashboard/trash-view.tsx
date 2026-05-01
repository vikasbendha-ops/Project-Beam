"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrashItem {
  id: string;
  title: string;
  type: string;
  thumbnail_url: string | null;
  deleted_at: string | null;
  created_at: string | null;
  status: string;
}

interface TrashViewProps {
  workspace: { id: string; name: string };
  items: TrashItem[];
}

const RETENTION_DAYS = 30;

export function TrashView({ workspace, items }: TrashViewProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function restore(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/markups/${id}/restore`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't restore");
      return;
    }
    toast.success("Restored");
    router.refresh();
  }

  async function purge(id: string, title: string) {
    if (
      !window.confirm(
        `Permanently delete "${title}"? This wipes every comment, version, and share link. There is no recovery.`,
      )
    )
      return;
    setBusyId(id);
    const res = await fetch(`/api/markups/${id}?purge=1`, {
      method: "DELETE",
    });
    setBusyId(null);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't delete");
      return;
    }
    toast.success("Permanently deleted");
    router.refresh();
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href={`/w/${workspace.id}`}>
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Trash
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Deleted MarkUps stay here for {RETENTION_DAYS} days, then are
              purged automatically.
            </p>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <Trash2
            className="size-10 text-muted-foreground/60"
            strokeWidth={1.25}
          />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Trash is empty
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            MarkUps you delete from the dashboard will land here.
          </p>
        </div>
      ) : (
        <ul className="grid gap-2 rounded-2xl border border-border bg-card p-2 shadow-card">
          {items.map((item) => (
            <TrashRow
              key={item.id}
              item={item}
              busy={busyId === item.id}
              disabled={busyId !== null && busyId !== item.id}
              onRestore={() => restore(item.id)}
              onPurge={() => purge(item.id, item.title)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TrashRow({
  item,
  busy,
  disabled,
  onRestore,
  onPurge,
}: {
  item: TrashItem;
  busy: boolean;
  disabled: boolean;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const Icon =
    item.type === "image"
      ? ImageIcon
      : item.type === "website"
        ? Globe
        : FileText;
  const daysLeft = computeDaysLeft(item.deleted_at);
  const expiringSoon = daysLeft != null && daysLeft <= 5;

  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-accent/40",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {item.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnail_url}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <Icon
            className="size-4 text-muted-foreground"
            strokeWidth={1.5}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.title}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Deleted {item.deleted_at ? timeAgo(item.deleted_at) : "recently"} ·{" "}
          {expiringSoon ? (
            <span className="inline-flex items-center gap-1 font-semibold text-destructive">
              <TriangleAlert className="size-3" />
              Purges in {daysLeft}d
            </span>
          ) : daysLeft != null ? (
            <span>Purges in {daysLeft}d</span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRestore}
          disabled={disabled || busy}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RotateCcw className="size-4" />
          )}
          Restore
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onPurge}
          disabled={disabled || busy}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete forever
        </Button>
      </div>
    </li>
  );
}

function computeDaysLeft(deletedAt: string | null): number | null {
  if (!deletedAt) return null;
  const deleted = new Date(deletedAt).getTime();
  const expires = deleted + RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const ms = expires - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function timeAgo(ts: string): string {
  const ms = Date.now() - new Date(ts).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
