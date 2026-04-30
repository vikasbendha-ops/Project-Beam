"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck } from "lucide-react";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

export function LoginConfirmBanner() {
  const params = useSearchParams();
  const justConfirmed = params.get("confirmed") === "1";
  const awaitingConfirm = params.get("confirm") === "1";
  const email = params.get("email") ?? "";

  if (!justConfirmed && !awaitingConfirm) return null;

  return (
    <div className="mb-2 flex flex-col gap-3 rounded-lg border border-border bg-accent px-4 py-3.5 text-sm text-accent-foreground">
      <div className="flex items-start gap-3">
        {justConfirmed ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        ) : (
          <MailCheck className="mt-0.5 size-4 shrink-0" />
        )}
        <p className="flex-1">
          {justConfirmed
            ? "Email confirmed. Log in to continue."
            : `We sent a confirmation email${email ? ` to ${email}` : ""}. Click the link, then log in.`}
        </p>
      </div>
      {awaitingConfirm && email ? (
        <ResendVerificationButton
          email={email}
          variant="outline"
          size="sm"
          className="self-start bg-card"
        />
      ) : null}
    </div>
  );
}
