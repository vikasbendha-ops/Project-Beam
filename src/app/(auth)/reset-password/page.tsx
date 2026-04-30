import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password · Beam",
};

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Choose a new password"
      subtitle="Pick something at least 8 characters long. You'll be signed in afterward."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
