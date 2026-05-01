import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { STATUS_LABEL } from "@/lib/constants";

const STATUS_VALUES = [
  "draft",
  "ready_for_review",
  "changes_requested",
  "approved",
] as const;

const patchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  folder_id: z.string().uuid().nullable().optional(),
  archived: z.boolean().optional(),
  status: z.enum(STATUS_VALUES).optional(),
});

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const updates: {
    title?: string;
    folder_id?: string | null;
    archived?: boolean;
    status?: (typeof STATUS_VALUES)[number];
    approved_at?: string | null;
    approved_by?: string | null;
  } = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.folder_id !== undefined)
    updates.folder_id = parsed.data.folder_id;
  if (parsed.data.archived !== undefined)
    updates.archived = parsed.data.archived;

  // Status changes are gated to members + owners (no guests).
  // We also need the previous status so we can skip dispatching when it's a no-op.
  let previousStatus:
    | (typeof STATUS_VALUES)[number]
    | null = null;
  let workspaceId: string | null = null;
  if (parsed.data.status !== undefined) {
    const { data: row } = await supabase
      .from("markups")
      .select("workspace_id, status")
      .eq("id", markupId)
      .maybeSingle();
    if (!row) {
      return NextResponse.json({ error: "Markup not found" }, { status: 404 });
    }
    workspaceId = row.workspace_id;
    previousStatus = row.status as (typeof STATUS_VALUES)[number];

    const { data: member } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", row.workspace_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member || member.role === "guest") {
      return NextResponse.json(
        { error: "You don't have permission to change status." },
        { status: 403 },
      );
    }

    updates.status = parsed.data.status;
    if (parsed.data.status === "approved") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
    } else if (previousStatus === "approved") {
      // Leaving approved — clear stamps.
      updates.approved_at = null;
      updates.approved_by = null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("markups")
    .update(updates)
    .eq("id", markupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify on status change (skip no-ops).
  if (
    parsed.data.status !== undefined &&
    workspaceId &&
    previousStatus !== parsed.data.status
  ) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle();
    const newLabel = STATUS_LABEL[parsed.data.status];
    const isApprove = parsed.data.status === "approved";
    await dispatchNotifications(createServiceClient(), {
      markupId,
      workspaceId,
      threadId: null,
      messageId: null,
      triggeredBy: user.id,
      triggeredByName: profile?.name ?? user.email ?? "Someone",
      contentPreview: isApprove
        ? "Marked the MarkUp as approved."
        : `Set status to ${newLabel}.`,
      type: isApprove ? "approve" : "status_change",
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ?purge=1 skips trash and hard-deletes immediately. Used by the trash UI.
  const purge = new URL(request.url).searchParams.get("purge") === "1";
  if (purge) {
    const { error } = await supabase
      .from("markups")
      .delete()
      .eq("id", markupId);
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Default: soft-delete by stamping deleted_at. Trash view + restore endpoint
  // can recover within the retention window.
  const { error } = await supabase
    .from("markups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", markupId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, trashed: true });
}
