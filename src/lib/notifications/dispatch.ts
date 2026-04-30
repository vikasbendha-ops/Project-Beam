import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getResend, FROM_EMAIL } from "@/lib/resend/client";
import { APP_NAME } from "@/lib/constants";
import type { Database } from "@/types/database";

type NotificationType = Database["public"]["Enums"]["notification_type"];

interface Recipient {
  user_id: string;
  email: string | null;
  name: string | null;
  digest: Database["public"]["Enums"]["email_digest_frequency"];
  /** "all" | "mentions" | "off" — per-markup, falling back to user default. */
  setting: Database["public"]["Enums"]["markup_notification_default"];
}

interface DispatchArgs {
  markupId: string;
  workspaceId: string;
  threadId: string | null;
  messageId: string | null;
  triggeredBy: string | null;
  triggeredByName: string;
  contentPreview: string;
  type: NotificationType;
  /** UUIDs of mentioned users (subset of workspace). They always get a notification. */
  mentionedUserIds?: string[];
}

/**
 * Resolves the recipient set, inserts notifications rows, and fires
 * Resend emails for users with realtime preference. Excludes the actor.
 */
export async function dispatchNotifications(
  supabase: SupabaseClient<Database>,
  args: DispatchArgs,
): Promise<void> {
  // 1. Pull workspace members.
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", args.workspaceId);

  if (!members || members.length === 0) return;
  const userIds = members.map((m) => m.user_id);

  // 2. Profiles in one fetch.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", userIds);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  // 3. Notification prefs (one row per user; missing rows fall back to default).
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(
      "user_id, email_digest_frequency, markup_notifications_default",
    )
    .in("user_id", userIds);
  const prefMap = new Map(
    (prefs ?? []).map((p) => [p.user_id, p]),
  );

  // 4. Per-markup overrides.
  const { data: overrides } = await supabase
    .from("markup_notification_settings")
    .select("user_id, setting")
    .eq("markup_id", args.markupId)
    .in("user_id", userIds);
  const overrideByUser = new Map(
    (overrides ?? []).map((o) => [o.user_id, o.setting]),
  );

  const recipients: Recipient[] = members
    .filter((m) => m.user_id !== args.triggeredBy)
    .map((m) => {
      const profile = profileMap.get(m.user_id);
      const pref = prefMap.get(m.user_id);
      return {
        user_id: m.user_id,
        email: profile?.email ?? null,
        name: profile?.name ?? null,
        digest: pref?.email_digest_frequency ?? "realtime",
        setting:
          overrideByUser.get(m.user_id) ??
          pref?.markup_notifications_default ??
          "all",
      };
    });

  if (recipients.length === 0) return;

  const mentioned = new Set(args.mentionedUserIds ?? []);

  // Filter by per-markup setting. mentions-only people receive only when
  // they're @-tagged. "off" people receive nothing.
  const targets = recipients.filter((r) => {
    if (r.setting === "off") return mentioned.has(r.user_id);
    if (r.setting === "mentions") return mentioned.has(r.user_id);
    return true;
  });

  if (targets.length === 0) return;

  // Insert notifications rows in one shot.
  const rows = targets.map((r) => ({
    user_id: r.user_id,
    type: mentioned.has(r.user_id)
      ? ("mention" as NotificationType)
      : args.type,
    workspace_id: args.workspaceId,
    markup_id: args.markupId,
    thread_id: args.threadId,
    message_id: args.messageId,
    triggered_by: args.triggeredBy,
    triggered_by_guest_name: args.triggeredBy ? null : args.triggeredByName,
    content_preview: args.contentPreview.slice(0, 240),
  }));

  await supabase.from("notifications").insert(rows);

  // Email — only for realtime preference. Daily/weekly digests are out of
  // scope for v1; "off" still receives emails for direct mentions.
  const resend = getResend();
  if (!resend) return;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const markupUrl = `${appUrl}/w/${args.workspaceId}/markup/${args.markupId}`;

  const subject = subjectFor(args.type, args.triggeredByName, mentioned.size);

  await Promise.all(
    targets
      .filter((r) => {
        if (!r.email) return false;
        if (r.digest === "off") return false;
        // realtime → always send. For digests we'd queue; for v1 we still
        // send realtime as a baseline so we don't lose notifications.
        return true;
      })
      .map(async (r) => {
        const text = [
          `${args.triggeredByName} ${verbFor(args.type, mentioned.has(r.user_id))} on a MarkUp.`,
          ``,
          `> ${args.contentPreview.slice(0, 240)}`,
          ``,
          `Open in ${APP_NAME}: ${markupUrl}`,
        ].join("\n");
        const html = `<!DOCTYPE html>
<html><body style="font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#FAFAF9;color:#1C1917;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E7E5E4;border-radius:14px;padding:24px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${esc(args.triggeredByName)} ${verbFor(args.type, mentioned.has(r.user_id))}</h1>
    <blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #4F46E5;background:#EEF2FF;color:#1C1917;font-size:14px;">${esc(args.contentPreview)}</blockquote>
    <p style="margin:24px 0;">
      <a href="${markupUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;font-size:14px;">
        Open in ${APP_NAME}
      </a>
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#A8A29E;margin-top:16px;">${APP_NAME} · ${appUrl}</p>
</body></html>`;
        try {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: r.email!,
            subject,
            html,
            text,
          });
        } catch (err) {
          console.error("[notifications] resend failed", err);
        }
      }),
  );
}

function verbFor(type: NotificationType, mentioned: boolean): string {
  if (mentioned) return "mentioned you";
  switch (type) {
    case "comment":
      return "left a comment";
    case "reply":
      return "replied to your thread";
    case "resolve":
      return "resolved a thread";
    case "status_change":
      return "updated the MarkUp status";
    case "share":
      return "shared a MarkUp with you";
    case "invite":
      return "invited you";
    case "approve":
      return "approved a MarkUp";
    default:
      return "took an action";
  }
}

function subjectFor(
  type: NotificationType,
  who: string,
  mentions: number,
): string {
  if (mentions > 0) return `${who} mentioned you on Beam`;
  switch (type) {
    case "comment":
      return `${who} left a comment on Beam`;
    case "reply":
      return `${who} replied on Beam`;
    case "resolve":
      return `${who} resolved a thread on Beam`;
    case "status_change":
      return `${who} updated a MarkUp on Beam`;
    case "approve":
      return `${who} approved a MarkUp on Beam`;
    default:
      return `${who} took an action on Beam`;
  }
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
