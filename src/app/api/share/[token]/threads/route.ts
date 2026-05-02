import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { guestThreadSchema } from "@/lib/validations/share";
import { resolveShareToken } from "@/lib/share/resolve";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/share/:token/threads — guest drops a pin via the public share
 * link. Persists thread + first message with guest_name / guest_email
 * (created_by = null).
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  const supabase = createServiceClient();
  const share = await resolveShareToken(supabase, token);
  if (!share)
    return NextResponse.json(
      { error: "Share link not found or expired" },
      { status: 404 },
    );
  if (!share.can_comment)
    return NextResponse.json(
      { error: "Comments are disabled on this share" },
      { status: 403 },
    );

  const json = await request.json().catch(() => null);
  const parsed = guestThreadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { guest, x_position, y_position, page_number, content } = parsed.data;

  // Compute next thread_number.
  const { count } = await supabase
    .from("threads")
    .select("*", { count: "exact", head: true })
    .eq("markup_id", share.markup_id);
  const threadNumber = (count ?? 0) + 1;

  // Resolve primary asset for the markup so threads land correctly even
  // for guest comments. Multi-asset guest UI is future work; for now guests
  // always pin against the primary asset.
  const { data: primaryAsset } = await supabase
    .from("assets")
    .select("id")
    .eq("markup_id", share.markup_id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!primaryAsset?.id)
    return NextResponse.json(
      { error: "Markup has no asset to attach this thread to." },
      { status: 400 },
    );

  // Resolve current version of the primary asset so guest pins land on a
  // version (compare views need this to scope correctly).
  const { data: currentVersion } = await supabase
    .from("markup_versions")
    .select("id")
    .eq("asset_id", primaryAsset.id)
    .eq("is_current", true)
    .maybeSingle();

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({
      markup_id: share.markup_id,
      asset_id: primaryAsset.id,
      markup_version_id: currentVersion?.id ?? null,
      thread_number: threadNumber,
      x_position,
      y_position,
      page_number: page_number ?? null,
      guest_name: guest.name,
      guest_email: guest.email && guest.email.length > 0 ? guest.email : null,
    })
    .select("id, thread_number")
    .single();
  if (threadError || !thread) {
    return NextResponse.json(
      { error: threadError?.message ?? "Couldn't drop pin" },
      { status: 500 },
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      content,
      guest_name: guest.name,
      guest_email: guest.email && guest.email.length > 0 ? guest.email : null,
    })
    .select("id")
    .single();
  if (messageError || !message) {
    await supabase.from("threads").delete().eq("id", thread.id);
    return NextResponse.json(
      { error: messageError?.message ?? "Couldn't post message" },
      { status: 500 },
    );
  }

  const { data: markup } = await supabase
    .from("markups")
    .select("workspace_id")
    .eq("id", share.markup_id)
    .maybeSingle();
  if (markup?.workspace_id) {
    await dispatchNotifications(supabase, {
      markupId: share.markup_id,
      workspaceId: markup.workspace_id,
      threadId: thread.id,
      messageId: message.id,
      triggeredBy: null,
      triggeredByName: guest.name,
      contentPreview: content,
      type: "comment",
    });
  }

  return NextResponse.json(
    {
      thread_id: thread.id,
      thread_number: thread.thread_number,
      message_id: message.id,
    },
    { status: 201 },
  );
}
