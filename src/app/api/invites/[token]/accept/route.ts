import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/invites/:token/accept — current user accepts a pending
 * workspace invite. Creates the workspace_members row, marks the invite
 * accepted, returns the workspace_id so the client can redirect.
 *
 * Caller must be authenticated; the token alone does not grant membership.
 * If the invite was sent to a different email than the caller's, we still
 * accept (workspaces can be invited by alias) and surface a warning.
 */
export async function POST(_request: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Service client bypasses RLS so the invite row can be read by any
  // authenticated user holding the token.
  const service = createServiceClient();
  const { data: invite } = await service
    .from("workspace_invites")
    .select(
      "id, workspace_id, email, role, expires_at, accepted_at, invited_by",
    )
    .eq("token", token)
    .maybeSingle();

  if (!invite)
    return NextResponse.json(
      { error: "Invite not found or already removed." },
      { status: 404 },
    );
  if (invite.accepted_at)
    return NextResponse.json(
      { error: "This invite has already been used." },
      { status: 410 },
    );
  if (invite.expires_at && new Date(invite.expires_at) < new Date())
    return NextResponse.json(
      { error: "This invite has expired." },
      { status: 410 },
    );

  // Insert membership (idempotent via the unique(workspace_id, user_id)
  // constraint — if it already exists, treat as success).
  const { error: insertError } = await service.from("workspace_members").insert({
    workspace_id: invite.workspace_id,
    user_id: user.id,
    role: invite.role,
    invited_by: invite.invited_by,
  });

  if (
    insertError &&
    !/duplicate key|unique constraint/i.test(insertError.message)
  ) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  await service
    .from("workspace_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ workspace_id: invite.workspace_id });
}
