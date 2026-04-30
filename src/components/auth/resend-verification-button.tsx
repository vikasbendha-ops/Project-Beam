"use client";

import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ResendVerificationButtonProps {
  email: string;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default";
  /** Lock the button for `cooldownSeconds` after a successful send. */
  cooldownSeconds?: number;
}

/**
 * Re-sends the email-confirmation message via Supabase Auth.
 * Safe to click for existing-confirmed users — Supabase silently no-ops.
 */
export function ResendVerificationButton({
  email,
  className,
  variant = "outline",
  size = "sm",
  cooldownSeconds = 60,
}: ResendVerificationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleClick() {
    if (loading || cooldown > 0) return;
    setLoading(true);
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/confirm` },
    });

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Confirmation email re-sent to ${email}.`);

    // 60-second cooldown to match Supabase smtp_max_frequency.
    setCooldown(cooldownSeconds);
    const timer = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading || cooldown > 0}
      className={cn("gap-1.5", className)}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MailCheck className="size-3.5" />
      )}
      {cooldown > 0
        ? `Resend in ${cooldown}s`
        : loading
          ? "Sending…"
          : "Resend verification email"}
    </Button>
  );
}
