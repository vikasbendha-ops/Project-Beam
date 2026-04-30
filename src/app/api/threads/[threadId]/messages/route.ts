import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { createMessageSchema } from "@/lib/validations/thread";

interface RouteContext {
  params: Promise<{ threadId: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { threadId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createMessageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      content: parsed.data.content,
      parent_message_id: parsed.data.parent_message_id ?? null,
      attachments: parsed.data.attachments ?? [],
      mentions: parsed.data.mentions ?? [],
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: error?.message ?? "Couldn't post message" },
      { status: 500 },
    );
  }

  // Bump the thread updated_at so the comment list re-sorts.
  await supabase
    .from("threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  const [{ data: thread }, { data: profile }] = await Promise.all([
    supabase
      .from("threads")
      .select("markup_id, markups!inner ( workspace_id )")
      .eq("id", threadId)
      .maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);
  if (thread?.markup_id && thread.markups?.workspace_id) {
    await dispatchNotifications(createServiceClient(), {
      markupId: thread.markup_id,
      workspaceId: thread.markups.workspace_id,
      threadId,
      messageId: message.id,
      triggeredBy: user.id,
      triggeredByName: profile?.name ?? user.email ?? "Someone",
      contentPreview: parsed.data.content,
      type: "reply",
      mentionedUserIds: parsed.data.mentions ?? [],
    });
  }

  return NextResponse.json({ id: message.id }, { status: 201 });
}
