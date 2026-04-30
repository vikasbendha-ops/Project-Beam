import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dispatchNotifications } from "@/lib/notifications/dispatch";

interface RouteContext {
  params: Promise<{ markupId: string }>;
}

/**
 * POST /api/markups/:id/approve
 *
 * Toggles the markup's approved state. Members + owners may approve;
 * guests cannot.
 *
 * Body: { approved: boolean }
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { markupId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const approved = Boolean(json?.approved ?? true);

  // Confirm caller is at least a member.
  const { data: markup } = await supabase
    .from("markups")
    .select("id, workspace_id")
    .eq("id", markupId)
    .maybeSingle();
  if (!markup) {
    return NextResponse.json({ error: "Markup not found" }, { status: 404 });
  }
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", markup.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest") {
    return NextResponse.json(
      { error: "You don't have permission to approve here." },
      { status: 403 },
    );
  }

  const updates = approved
    ? {
        status: "approved" as const,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      }
    : {
        status: "ready_for_review" as const,
        approved_at: null,
        approved_by: null,
      };

  const { error } = await supabase
    .from("markups")
    .update(updates)
    .eq("id", markupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify workspace members that the markup was approved / reopened.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  void dispatchNotifications(createServiceClient(), {
    markupId,
    workspaceId: markup.workspace_id,
    threadId: null,
    messageId: null,
    triggeredBy: user.id,
    triggeredByName: profile?.name ?? user.email ?? "Someone",
    contentPreview: approved
      ? "Marked the MarkUp as approved."
      : "Reopened the MarkUp for review.",
    type: approved ? "approve" : "status_change",
  });

  return NextResponse.json({ ok: true });
}
