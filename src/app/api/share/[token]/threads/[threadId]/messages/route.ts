import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { guestMessageSchema } from "@/lib/validations/share";
import { resolveShareToken } from "@/lib/share/resolve";

interface RouteContext {
  params: Promise<{ token: string; threadId: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { token, threadId } = await ctx.params;
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
  const parsed = guestMessageSchema.safeParse({
    ...json,
    thread_id: threadId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { guest, content, parent_message_id } = parsed.data;

  // Confirm the thread belongs to the markup we share-link to.
  const { data: thread } = await supabase
    .from("threads")
    .select("id, markup_id")
    .eq("id", threadId)
    .maybeSingle();
  if (!thread || thread.markup_id !== share.markup_id)
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      content,
      parent_message_id: parent_message_id ?? null,
      guest_name: guest.name,
      guest_email: guest.email && guest.email.length > 0 ? guest.email : null,
    })
    .select("id")
    .single();
  if (error || !data)
    return NextResponse.json(
      { error: error?.message ?? "Couldn't post" },
      { status: 500 },
    );

  await supabase
    .from("threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);

  return NextResponse.json({ id: data.id }, { status: 201 });
}
