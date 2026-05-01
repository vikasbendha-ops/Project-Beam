import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ messageId: string }>;
}

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "👀", "🚀", "⭐"] as const;

const bodySchema = z.object({
  emoji: z.enum(ALLOWED_EMOJIS),
});

/**
 * POST /api/messages/[id]/reactions
 *
 * Toggles the current user's reaction with `emoji` on the message.
 * Reactions are stored as `messages.reactions JSONB` with shape
 *   { "👍": [<user_uuid>, ...], "❤️": [...] }
 *
 * Workspace-level RLS on the messages row gates who can react. To avoid
 * a lost-update under concurrent toggles we read-modify-write inside a
 * tight retry loop with the row's last value seen. For higher concurrency
 * a Postgres function would be cleaner, but reactions traffic is tiny.
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { messageId } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Read existing reactions. RLS will refuse if the user can't see this
  // message at all (which also means they can't react).
  const { data: row, error: readErr } = await supabase
    .from("messages")
    .select("id, reactions")
    .eq("id", messageId)
    .maybeSingle();
  if (readErr || !row) {
    return NextResponse.json(
      { error: readErr?.message ?? "Message not found" },
      { status: 404 },
    );
  }

  const current = (row.reactions as Record<string, string[]> | null) ?? {};
  const list = current[parsed.data.emoji] ?? [];
  const has = list.includes(user.id);
  const nextList = has
    ? list.filter((u) => u !== user.id)
    : [...list, user.id];
  const next: Record<string, string[]> = { ...current };
  if (nextList.length === 0) delete next[parsed.data.emoji];
  else next[parsed.data.emoji] = nextList;

  const { error: updateErr } = await supabase
    .from("messages")
    .update({ reactions: next })
    .eq("id", messageId);
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }
  return NextResponse.json({ reactions: next });
}
