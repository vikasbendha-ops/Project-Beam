import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { createThreadSchema } from "@/lib/validations/thread";

/**
 * POST /api/threads
 *
 * Drops a new pin on a markup. Creates a `threads` row + the first
 * `messages` row in a single request. Auto-numbers `thread_number` per
 * markup (the small digit shown inside the pin).
 *
 * Status transition (handled by DB trigger):
 *   - First non-owner comment → markup.status = 'changes_requested'
 *   - Owner-only first comment → markup.status = 'ready_for_review'
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createThreadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const {
    markup_id,
    markup_version_id,
    asset_id: assetIdInput,
    x_position,
    y_position,
    page_number,
    device_type,
    priority,
    content,
    attachments,
    mentions,
  } = parsed.data;

  // Resolve the workspace owning the markup (RLS will block reads if the
  // user has no membership; we use the result to short-circuit).
  const { data: markup } = await supabase
    .from("markups")
    .select("id, workspace_id")
    .eq("id", markup_id)
    .maybeSingle();
  if (!markup) {
    return NextResponse.json({ error: "Markup not found" }, { status: 404 });
  }

  // Compute the next thread_number per markup. Race-tolerant under the
  // expected single-user pin-drop volume; trigger can later replace this
  // with a sequence if contention shows up.
  const { count: existingCount } = await supabase
    .from("threads")
    .select("*", { count: "exact", head: true })
    .eq("markup_id", markup_id);

  const threadNumber = (existingCount ?? 0) + 1;

  // Resolve asset_id (NOT NULL on threads): explicit input > markup's
  // primary asset (position 0).
  let resolvedAssetId = assetIdInput ?? null;
  if (!resolvedAssetId) {
    const { data: primary } = await supabase
      .from("assets")
      .select("id")
      .eq("markup_id", markup_id)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();
    resolvedAssetId = primary?.id ?? null;
  }
  if (!resolvedAssetId)
    return NextResponse.json(
      { error: "Markup has no asset to attach this thread to." },
      { status: 400 },
    );

  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({
      markup_id,
      markup_version_id: markup_version_id ?? null,
      asset_id: resolvedAssetId,
      thread_number: threadNumber,
      x_position,
      y_position,
      page_number: page_number ?? null,
      device_type: device_type ?? null,
      priority: priority ?? "none",
      created_by: user.id,
    })
    .select("id, thread_number")
    .single();

  if (threadError || !thread) {
    return NextResponse.json(
      { error: threadError?.message ?? "Couldn't create thread" },
      { status: 500 },
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      thread_id: thread.id,
      content,
      attachments: attachments ?? [],
      mentions: mentions ?? [],
      created_by: user.id,
    })
    .select("id")
    .single();

  if (messageError || !message) {
    // Roll back the thread so we don't leave a pin with no message.
    await supabase.from("threads").delete().eq("id", thread.id);
    return NextResponse.json(
      { error: messageError?.message ?? "Couldn't post message" },
      { status: 500 },
    );
  }

  // Fire-and-forget notifications (service-role bypasses RLS so we can
  // insert rows for every workspace member).
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  const triggeredByName = profile?.name ?? user.email ?? "Someone";
  await dispatchNotifications(createServiceClient(), {
    markupId: markup.id,
    workspaceId: markup.workspace_id,
    threadId: thread.id,
    messageId: message.id,
    triggeredBy: user.id,
    triggeredByName,
    contentPreview: content,
    type: "comment",
    mentionedUserIds: mentions ?? [],
  });

  return NextResponse.json(
    {
      thread_id: thread.id,
      thread_number: thread.thread_number,
      message_id: message.id,
    },
    { status: 201 },
  );
}
