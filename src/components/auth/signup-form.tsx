"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { createClient } from "@/lib/supabase/client";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

type ExistingState =
  | { kind: "none" }
  | {
      kind: "exists";
      email: string;
      probe: "confirmed" | "unconfirmed" | "unknown";
    };

export function SignupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [existing, setExisting] = useState<ExistingState>({ kind: "none" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function probe(email: string) {
    try {
      const res = await fetch("/api/auth/probe-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return "unknown" as const;
      const json = (await res.json()) as {
        state: "confirmed" | "unconfirmed" | "unknown";
      };
      return json.state;
    } catch {
      return "unknown" as const;
    }
  }

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
      if (
        error.status === 400 &&
        error.message.toLowerCase().includes("already")
      ) {
        const probed = await probe(values.email);
        setExisting({ kind: "exists", email: values.email, probe: probed });
        return;
      }
      toast.error(error.message);
      return;
    }

    // Supabase silently returns a fake user when the email is already
    // registered. Detect via empty identities[].
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      const probed = await probe(values.email);
      setExisting({ kind: "exists", email: values.email, probe: probed });
      return;
    }

    toast.success("Check your email to confirm your account.");
    router.push(`/login?confirm=1&email=${encodeURIComponent(values.email)}`);
  });

  if (existing.kind === "exists") {
    return <ExistingPanel state={existing} onReset={() => setExisting({ kind: "none" })} />;
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

interface ExistingPanelProps {
  state: Extract<ExistingState, { kind: "exists" }>;
  onReset: () => void;
}

function ExistingPanel({ state, onReset }: ExistingPanelProps) {
  const { email, probe: status } = state;

  if (status === "confirmed") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">You already have a Beam account.</p>
            <p className="mt-1 text-emerald-800">
              <span className="font-medium">{email}</span> is registered and
              verified. Log in to continue, or reset your password if you don't
              remember it.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href={`/login?email=${encodeURIComponent(email)}`}>
              Log in
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/forgot-password?email=${encodeURIComponent(email)}`}>
              Reset password
            </Link>
          </Button>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="mx-auto text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (status === "unconfirmed") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">
              Verification still pending for {email}.
            </p>
            <p className="mt-1 text-amber-800">
              We already sent a confirmation email. Re-send it below if it
              didn't arrive — links from previous attempts also still work.
            </p>
          </div>
        </div>
        <ResendVerificationButton
          email={email}
          variant="default"
          size="default"
        />
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <span>
            Already confirmed?{" "}
            <Link
              href={`/login?email=${encodeURIComponent(email)}`}
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </span>
          <button
            type="button"
            onClick={onReset}
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // Unknown — couldn't probe. Show all options defensively.
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">An account with this email exists.</p>
          <p className="mt-1 text-amber-800">
            Log in if you remember your password, reset it if not, or — for
            unverified accounts — re-send the confirmation email.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href={`/login?email=${encodeURIComponent(email)}`}>
            Log in
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/forgot-password?email=${encodeURIComponent(email)}`}>
            Reset password
          </Link>
        </Button>
      </div>
      <ResendVerificationButton email={email} variant="ghost" size="sm" />
      <button
        type="button"
        onClick={onReset}
        className="mx-auto text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        Use a different email
      </button>
    </div>
  );
}
