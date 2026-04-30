"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent. Check your inbox.");
    setSent(true);
  });

  if (sent) {
    return (
      <div className="rounded-lg border border-border bg-accent px-4 py-4 text-sm text-accent-foreground">
        We sent a password-reset link to{" "}
        <span className="font-semibold">{getValues("email")}</span>. Click the
        link in the email to choose a new password. The link expires in 1 hour.
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting} className="h-11">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
