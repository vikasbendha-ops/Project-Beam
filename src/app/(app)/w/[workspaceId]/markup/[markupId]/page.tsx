import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Canvas · Beam",
};

interface MarkupPageProps {
  params: Promise<{ workspaceId: string; markupId: string }>;
}

export default async function MarkupCanvasPlaceholder({
  params,
}: MarkupPageProps) {
  const { workspaceId, markupId } = await params;
  const supabase = await createClient();

  const { data: markup } = await supabase
    .from("markups")
    .select("id, title, type, status, source_url, workspace_id")
    .eq("id", markupId)
    .maybeSingle();

  if (!markup || markup.workspace_id !== workspaceId) notFound();

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Link
        href={`/w/${workspaceId}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {markup.title}
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {markup.type}
            </p>
          </div>
          <StatusPill status={markup.status} />
        </div>
        {markup.source_url ? (
          <a
            href={markup.source_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ExternalLink className="size-4" /> {markup.source_url}
          </a>
        ) : null}
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Canvas viewer coming in Phase 5
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Pin placement, comment threads, realtime updates, version history,
            sharing, and approve all land in the next two phases.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href={`/w/${workspaceId}`}>Back to all projects</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
