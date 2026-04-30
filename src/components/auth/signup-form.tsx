"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

type ExistingUserState =
  | { kind: "none" }
  | { kind: "exists"; email: string };

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [existing, setExisting] = useState<ExistingUserState>({ kind: "none" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setExisting({ kind: "none" });
    const supabase = createClient();
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { name: values.name },
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });

    if (error) {
      // Supabase explicit error — usually "User already registered" when
      // `enable_signup` allows it, or rate-limit / weak-password.
      if (
        error.status === 400 &&
        error.message.toLowerCase().includes("already")
      ) {
        setExisting({ kind: "exists", email: values.email });
        return;
      }
      toast.error(error.message);
      return;
    }

    // Supabase silently returns a fake user when the email is already
    // registered (security against email enumeration). The tell is an
    // empty `identities` array on the returned user.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      setExisting({ kind: "exists", email: values.email });
      return;
    }

    toast.success("Check your email to confirm your account.");
    router.push(`/login?confirm=1&email=${encodeURIComponent(values.email)}`);
  });

  if (existing.kind === "exists") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">An account with this email exists.</p>
            <p className="mt-1 text-amber-800">
              Log in instead, or — if you never confirmed the original signup —
              re-send the verification email below.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link
              href={`/login?email=${encodeURIComponent(existing.email)}`}
            >
              Log in
            </Link>
          </Button>
          <ResendVerificationButton
            email={existing.email}
            className="flex-1"
            variant="outline"
            size="default"
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <span>
            Forgot your password?{" "}
            <Link
              href={`/forgot-password?email=${encodeURIComponent(existing.email)}`}
              className="font-semibold text-primary hover:underline"
            >
              Reset it
            </Link>
          </span>
          <button
            type="button"
            onClick={() => setExisting({ kind: "none" })}
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          placeholder="Jane Doe"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="jane@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-1 h-11">
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
