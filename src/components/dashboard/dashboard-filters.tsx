"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDownUp, Check, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/constants";
import type { Database } from "@/types/database";

type MarkupStatus = Database["public"]["Enums"]["markup_status"];

const FILTER_OPTIONS: Array<{
  key: MarkupStatus | "all";
  label: string;
  dot: string;
}> = [
  { key: "all", label: "All", dot: "bg-muted-foreground/40" },
  { key: "draft", label: STATUS_LABEL.draft, dot: "bg-muted-foreground/60" },
  {
    key: "ready_for_review",
    label: STATUS_LABEL.ready_for_review,
    dot: "bg-sky-500",
  },
  {
    key: "changes_requested",
    label: STATUS_LABEL.changes_requested,
    dot: "bg-amber-500",
  },
  { key: "approved", label: STATUS_LABEL.approved, dot: "bg-emerald-500" },
];

export type SortKey =
  | "updated"
  | "created"
  | "comments"
  | "review";

const SORT_LABEL: Record<SortKey, string> = {
  updated: "Recently updated",
  created: "Recently created",
  comments: "Most commented",
  review: "Awaiting review",
};

interface DashboardFiltersProps {
  /** Optional counts per status, shown as suffix when present. */
  counts?: Partial<Record<MarkupStatus | "all", number>>;
}

export function DashboardFilters({ counts }: DashboardFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const currentStatus = (params.get("status") ?? "all") as
    | MarkupStatus
    | "all";
  const currentQuery = params.get("q") ?? "";
  const currentSort = (params.get("sort") ?? "updated") as SortKey;

  const [q, setQ] = useState(currentQuery);
  const lastPushedRef = useRef(currentQuery);

  // Debounced URL push for search input.
  useEffect(() => {
    if (q === lastPushedRef.current) return;
    const t = setTimeout(() => {
      lastPushedRef.current = q;
      const next = new URLSearchParams(params.toString());
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      startTransition(() => {
        router.replace(`?${next.toString()}`, { scroll: false });
      });
    }, 200);
    return () => clearTimeout(t);
  }, [q, params, router]);

  function setStatus(s: MarkupStatus | "all") {
    const next = new URLSearchParams(params.toString());
    if (s === "all") next.delete("status");
    else next.set("status", s);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  function setSort(s: SortKey) {
    const next = new URLSearchParams(params.toString());
    if (s === "updated") next.delete("sort");
    else next.set("sort", s);
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTER_OPTIONS.map((opt) => {
          const active = opt.key === currentStatus;
          const count = counts?.[opt.key];
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setStatus(opt.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  active ? "bg-background/80" : opt.dot,
                )}
              />
              {opt.label}
              {typeof count === "number" ? (
                <span
                  className={cn(
                    "tabular-nums",
                    active ? "text-background/80" : "text-muted-foreground/70",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1 lg:w-72 lg:flex-initial">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or URL"
            className="h-9 w-full rounded-full border border-border bg-card pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {q ? (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Sort"
          >
            <ArrowDownUp className="size-3.5" />
            <span className="hidden sm:inline">{SORT_LABEL[currentSort]}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sort by
            </DropdownMenuLabel>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((s) => {
              const active = s === currentSort;
              return (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => setSort(s)}
                  className={cn(active && "bg-muted/40 font-semibold")}
                >
                  <span className="flex-1">{SORT_LABEL[s]}</span>
                  {active ? (
                    <Check className="size-4 text-muted-foreground" />
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
