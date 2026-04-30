import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, Globe, Image as ImageIcon, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { StatusPill } from "@/components/dashboard/status-pill";
import type { Database } from "@/types/database";

type MarkupSummary = Database["public"]["Views"]["markup_summary"]["Row"];

interface MarkupCardProps {
  markup: MarkupSummary;
  workspaceId: string;
}

const TYPE_ICON = {
  image: ImageIcon,
  pdf: FileText,
  website: Globe,
} as const;

export function MarkupCard({ markup, workspaceId }: MarkupCardProps) {
  const TypeIcon = markup.type ? TYPE_ICON[markup.type] : FileText;
  const updated = markup.updated_at
    ? format(new Date(markup.updated_at), "MMM d, yyyy")
    : "—";

  return (
    <Link
      href={`/w/${workspaceId}/markup/${markup.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/30"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {markup.thumbnail_url ? (
          <Image
            src={markup.thumbnail_url}
            alt={markup.title ?? "MarkUp thumbnail"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <TypeIcon className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {markup.status ? (
          <div className="absolute left-2 top-2">
            <StatusPill status={markup.status} size="sm" />
          </div>
        ) : null}
      </div>
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {markup.title ?? "Untitled"}
        </h3>
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3" strokeWidth={1.5} />
            {updated}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="size-3" strokeWidth={1.5} />
            {markup.thread_count ?? 0}
          </span>
        </div>
      </div>
    </Link>
  );
}
