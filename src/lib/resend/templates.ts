import "server-only";
import { APP_NAME } from "@/lib/constants";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface InviteParams {
  recipientEmail: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  message?: string | null;
}

export function workspaceInviteEmail({
  inviterName,
  workspaceName,
  inviteUrl,
  message,
}: InviteParams) {
  const subject = `${inviterName} invited you to ${workspaceName} on ${APP_NAME}`;
  const text = [
    `${inviterName} invited you to join the "${workspaceName}" workspace on ${APP_NAME}.`,
    message ? `\nMessage from ${inviterName}:\n"${message}"` : "",
    `\nAccept the invite:\n${inviteUrl}`,
    `\nIf you weren't expecting this, you can ignore this email.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#FAFAF9;color:#1C1917;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E7E5E4;border-radius:14px;padding:24px;">
    <h1 style="font-size:20px;margin:0 0 12px;">You're invited to ${esc(workspaceName)}</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#57534E;">
      <strong>${esc(inviterName)}</strong> invited you to collaborate on the
      <strong>${esc(workspaceName)}</strong> workspace.
    </p>
    ${
      message
        ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #4F46E5;background:#EEF2FF;color:#1C1917;font-size:14px;">${esc(message)}</blockquote>`
        : ""
    }
    <p style="margin:24px 0;">
      <a href="${inviteUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">
        Accept invite
      </a>
    </p>
    <p style="font-size:12px;color:#A8A29E;line-height:1.6;margin:0;">
      Or paste this link: ${inviteUrl}
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#A8A29E;margin-top:16px;">${APP_NAME} · ${APP_URL}</p>
</body>
</html>`;

  return { subject, html, text };
}

interface ShareNotifyParams {
  recipientEmail: string;
  inviterName: string;
  markupTitle: string;
  shareUrl: string;
  message?: string | null;
}

export function shareLinkEmail({
  inviterName,
  markupTitle,
  shareUrl,
  message,
}: ShareNotifyParams) {
  const subject = `${inviterName} shared "${markupTitle}" with you on ${APP_NAME}`;
  const text = [
    `${inviterName} shared the MarkUp "${markupTitle}" with you on ${APP_NAME}.`,
    message ? `\nMessage:\n"${message}"` : "",
    `\nReview + comment (no signup required):\n${shareUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:'Plus Jakarta Sans',Arial,sans-serif;background:#FAFAF9;color:#1C1917;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E7E5E4;border-radius:14px;padding:24px;">
    <h1 style="font-size:20px;margin:0 0 12px;">${esc(inviterName)} shared a MarkUp with you</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#57534E;">
      <strong>${esc(markupTitle)}</strong>
    </p>
    ${
      message
        ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #4F46E5;background:#EEF2FF;color:#1C1917;font-size:14px;">${esc(message)}</blockquote>`
        : ""
    }
    <p style="margin:24px 0;">
      <a href="${shareUrl}" style="display:inline-block;background:#4F46E5;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;font-size:14px;">
        Review + comment
      </a>
    </p>
    <p style="font-size:12px;color:#A8A29E;line-height:1.6;margin:0;">
      Or paste this link: ${shareUrl}<br>
      You don't need a Beam account — drop comments as a guest.
    </p>
  </div>
  <p style="text-align:center;font-size:12px;color:#A8A29E;margin-top:16px;">${APP_NAME} · ${APP_URL}</p>
</body>
</html>`;

  return { subject, html, text };
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
