import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password · Beam",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Back to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
