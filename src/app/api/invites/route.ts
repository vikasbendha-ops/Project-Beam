import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { inviteSchema } from "@/lib/validations/share";
import {
  workspaceInviteEmail,
  shareLinkEmail,
} from "@/lib/resend/templates";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * POST /api/invites — invites people to a workspace by email.
 *
 * If `markup_id` is provided + `role=guest`, instead creates a share-link
 * scoped to that markup and emails the share URL — guests don't get a
 * workspace membership row, they comment via the share token. For role
 * `member`, a `workspace_invites` row is created and an invite-acceptance
 * link is emailed.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const { workspace_id, emails, role, message, markup_id } = parsed.data;

  // Authorise: caller must be member with role member or owner.
  const { data: member } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member || member.role === "guest")
    return NextResponse.json(
      { error: "You don't have permission to invite here." },
      { status: 403 },
    );

  const [{ data: workspace }, { data: profile }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name")
      .eq("id", workspace_id)
      .maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);

  if (!workspace)
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const inviterName = profile?.name ?? user.email ?? "Someone";

  // Reuse a single share link per markup for guest invites.
  let shareUrl: string | null = null;
  let markupTitle: string | null = null;
  if (role === "guest" && markup_id) {
    const { data: m } = await supabase
      .from("markups")
      .select("title")
      .eq("id", markup_id)
      .maybeSingle();
    markupTitle = m?.title ?? null;

    const { data: existing } = await supabase
      .from("share_links")
      .select("token")
      .eq("markup_id", markup_id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.token) {
      shareUrl = `${APP_URL}/share/${existing.token}`;
    } else {
      const { data: created, error: shareError } = await supabase
        .from("share_links")
        .insert({
          markup_id,
          can_comment: true,
          created_by: user.id,
        })
        .select("token")
        .single();
      if (shareError || !created)
        return NextResponse.json(
          { error: shareError?.message ?? "Couldn't create share link" },
          { status: 500 },
        );
      shareUrl = `${APP_URL}/share/${created.token}`;
    }
  }

  const resend = getResend();
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const email of emails) {
    if (role === "guest") {
      // Email the share link directly. We don't persist a workspace_invite
      // row for guests; their identity is captured at comment-time.
      if (!resend || !shareUrl) {
        failed.push({
          email,
          error: !resend ? "Email service not configured" : "Share URL missing",
        });
        continue;
      }
      const { subject, html, text } = shareLinkEmail({
        recipientEmail: email,
        inviterName,
        markupTitle: markupTitle ?? "a MarkUp",
        shareUrl,
        message,
      });
      const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
        text,
      });
      if (error) failed.push({ email, error: error.message });
      else sent.push(email);
      continue;
    }

    // role === 'member' → workspace_invites flow.
    // Use service client so the unique-token + RLS constraints don't trip on
    // a row created by the inviter (RLS allows the inviter to insert, but
    // we want robust write here).
    const service = createServiceClient();
    const { data: invite, error: insertError } = await service
      .from("workspace_invites")
      .insert({
        workspace_id,
        email,
        role: "member",
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (insertError || !invite) {
      failed.push({
        email,
        error: insertError?.message ?? "Couldn't create invite",
      });
      continue;
    }

    if (!resend) {
      failed.push({ email, error: "Email service not configured" });
      continue;
    }

    const inviteUrl = `${APP_URL}/invites/${invite.token}`;
    const { subject, html, text } = workspaceInviteEmail({
      recipientEmail: email,
      inviterName,
      workspaceName: workspace.name,
      inviteUrl,
      message,
    });
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      text,
    });
    if (sendError) failed.push({ email, error: sendError.message });
    else sent.push(email);
  }

  return NextResponse.json({ sent, failed, share_url: shareUrl });
}
