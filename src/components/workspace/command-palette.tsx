"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  FileText,
  Globe,
  Image as ImageIcon,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface SearchHit {
  id: string;
  title: string | null;
  type: "image" | "pdf" | "website" | null;
  status: string | null;
  thumbnail_url: string | null;
  folder_id: string | null;
}

interface CommandPaletteProps {
  workspaceId: string;
}

interface ActionItem {
  id: string;
  label: string;
  hint?: string;
  Icon: typeof Search;
  onSelect: () => void;
  group: "Actions" | "Navigate";
}

/**
 * Cmd+K palette. Mounted globally inside AppShell so any authenticated
 * page can summon it. Search hits load via /api/search (debounced 150ms);
 * static actions + nav items always show.
 *
 * Keyboard: Cmd/Ctrl+K opens, Esc closes, ↑/↓ moves selection, Enter
 * activates. Mouse hover also moves selection.
 */
export function CommandPalette({ workspaceId }: CommandPaletteProps) {
  const router = useRouter();
  const setNewMarkupOpen = useUIStore((s) => s.setNewMarkupOpen);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Cmd+K / Ctrl+K toggles. Skip when an input is focused unless palette
  // is already open (so users can keep typing inside it).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset state on close.
  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
      setActive(0);
      return;
    }
    // Focus the input on next tick (Dialog content mounts async).
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  // Debounced fetch.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?workspace_id=${workspaceId}&q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as { markups: SearchHit[] };
        setHits(json.markups ?? []);
        setActive(0);
      } catch {
        // ignore
      }
    }, 150);
    return () => clearTimeout(t);
  }, [q, open, workspaceId]);

  // Static action + navigate items.
  const staticItems: ActionItem[] = [
    {
      id: "new-markup",
      label: "New MarkUp",
      hint: "Upload or paste URL",
      Icon: Plus,
      group: "Actions",
      onSelect: () => {
        setOpen(false);
        setNewMarkupOpen(true);
      },
    },
    {
      id: "nav-dashboard",
      label: "All Projects",
      Icon: Building2,
      group: "Navigate",
      onSelect: () => {
        setOpen(false);
        router.push(`/w/${workspaceId}`);
      },
    },
    {
      id: "nav-people",
      label: "People",
      Icon: Users,
      group: "Navigate",
      onSelect: () => {
        setOpen(false);
        router.push(`/w/${workspaceId}/people`);
      },
    },
    {
      id: "nav-notifications",
      label: "Notifications",
      Icon: Bell,
      group: "Navigate",
      onSelect: () => {
        setOpen(false);
        router.push(`/w/${workspaceId}/notifications`);
      },
    },
    {
      id: "nav-settings",
      label: "Workspace settings",
      Icon: Settings,
      group: "Navigate",
      onSelect: () => {
        setOpen(false);
        router.push(`/w/${workspaceId}/settings`);
      },
    },
  ];

  // Filter static items by query (case-insensitive label/hint match).
  const ql = q.trim().toLowerCase();
  const filteredStatic = ql
    ? staticItems.filter(
        (i) =>
          i.label.toLowerCase().includes(ql) ||
          (i.hint?.toLowerCase().includes(ql) ?? false),
      )
    : staticItems;

  // Flat list for keyboard nav.
  const flatList: Array<
    | { kind: "markup"; item: SearchHit }
    | { kind: "action"; item: ActionItem }
  > = [
    ...hits.map((h) => ({ kind: "markup" as const, item: h })),
    ...filteredStatic.map((a) => ({ kind: "action" as const, item: a })),
  ];

  const total = flatList.length;

  function move(delta: number) {
    if (total === 0) return;
    setActive((i) => (i + delta + total) % total);
  }

  function activate() {
    const row = flatList[active];
    if (!row) return;
    if (row.kind === "markup") {
      setOpen(false);
      router.push(`/w/${workspaceId}/markup/${row.item.id}`);
    } else {
      row.item.onSelect();
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      activate();
    }
  }

  // Group rendering. Markups always first, then Actions, then Navigate.
  const markupRows = flatList.filter((r) => r.kind === "markup");
  const actionRows = flatList.filter(
    (r) => r.kind === "action" && r.item.group === "Actions",
  );
  const navRows = flatList.filter(
    (r) => r.kind === "action" && r.item.group === "Navigate",
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search markups, run a command…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-flex">
            Esc
          </kbd>
        </div>
        <div
          ref={listRef}
          className="max-h-[440px] overflow-y-auto py-1.5 text-sm"
        >
          {total === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results.
            </div>
          ) : null}
          {markupRows.length > 0 ? (
            <Group title="Markups">
              {markupRows.map((r, i) => {
                if (r.kind !== "markup") return null;
                const indexInFlat = flatList.findIndex(
                  (x) => x.kind === "markup" && x.item.id === r.item.id,
                );
                return (
                  <MarkupRow
                    key={r.item.id}
                    hit={r.item}
                    selected={indexInFlat === active}
                    onHover={() => setActive(indexInFlat)}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/w/${workspaceId}/markup/${r.item.id}`);
                    }}
                  />
                );
              })}
            </Group>
          ) : null}
          {actionRows.length > 0 ? (
            <Group title="Actions">
              {actionRows.map((r) => {
                if (r.kind !== "action") return null;
                const indexInFlat = flatList.findIndex(
                  (x) => x.kind === "action" && x.item.id === r.item.id,
                );
                return (
                  <ActionRow
                    key={r.item.id}
                    item={r.item}
                    selected={indexInFlat === active}
                    onHover={() => setActive(indexInFlat)}
                    onClick={r.item.onSelect}
                  />
                );
              })}
            </Group>
          ) : null}
          {navRows.length > 0 ? (
            <Group title="Navigate">
              {navRows.map((r) => {
                if (r.kind !== "action") return null;
                const indexInFlat = flatList.findIndex(
                  (x) => x.kind === "action" && x.item.id === r.item.id,
                );
                return (
                  <ActionRow
                    key={r.item.id}
                    item={r.item}
                    selected={indexInFlat === active}
                    onHover={() => setActive(indexInFlat)}
                    onClick={r.item.onSelect}
                  />
                );
              })}
            </Group>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate · <Kbd>Enter</Kbd> open
          </span>
          <span>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TYPE_ICON: Record<NonNullable<SearchHit["type"]>, typeof FileText> = {
  image: ImageIcon,
  pdf: FileText,
  website: Globe,
};

function MarkupRow({
  hit,
  selected,
  onHover,
  onClick,
}: {
  hit: SearchHit;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const Icon = hit.type ? TYPE_ICON[hit.type] : FileText;
  return (
    <button
      type="button"
      onMouseMove={onHover}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
        selected ? "bg-accent" : "hover:bg-muted/50",
      )}
    >
      <div className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
        {hit.thumbnail_url ? (
          <Image
            src={hit.thumbnail_url}
            alt=""
            fill
            sizes="32px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Icon className="size-4" strokeWidth={1.5} />
          </div>
        )}
      </div>
      <span className="flex-1 truncate text-foreground">
        {hit.title ?? "Untitled"}
      </span>
      {selected ? (
        <ArrowRight className="size-3.5 text-muted-foreground" />
      ) : null}
    </button>
  );
}

function ActionRow({
  item,
  selected,
  onHover,
  onClick,
}: {
  item: ActionItem;
  selected: boolean;
  onHover: () => void;
  onClick: () => void;
}) {
  const Icon = item.Icon;
  return (
    <button
      type="button"
      onMouseMove={onHover}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
        selected ? "bg-accent" : "hover:bg-muted/50",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
        <Icon className="size-4" strokeWidth={1.5} />
      </div>
      <div className="flex flex-1 flex-col">
        <span className="truncate text-foreground">{item.label}</span>
        {item.hint ? (
          <span className="truncate text-[11px] text-muted-foreground">
            {item.hint}
          </span>
        ) : null}
      </div>
      {selected ? (
        <ArrowRight className="size-3.5 text-muted-foreground" />
      ) : null}
    </button>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {children}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-semibold text-foreground">
      {children}
    </kbd>
  );
}
