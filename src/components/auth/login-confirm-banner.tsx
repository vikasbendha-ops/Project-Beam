"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle2, MailCheck } from "lucide-react";

export function LoginConfirmBanner() {
  const params = useSearchParams();
  const justConfirmed = params.get("confirmed") === "1";
  const awaitingConfirm = params.get("confirm") === "1";

  if (!justConfirmed && !awaitingConfirm) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-accent px-4 py-3 text-sm text-accent-foreground">
      {justConfirmed ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      ) : (
        <MailCheck className="mt-0.5 size-4 shrink-0" />
      )}
      <p>
        {justConfirmed
          ? "Email confirmed. You can log in now."
          : "We sent you a confirmation email. Click the link, then log in."}
      </p>
    </div>
  );
}
