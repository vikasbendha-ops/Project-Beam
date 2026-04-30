import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { LoginConfirmBanner } from "@/components/auth/login-confirm-banner";

export const metadata: Metadata = {
  title: "Log in · Beam",
  description: "Log in to your Beam account.",
};

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Please enter your details to sign in."
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginConfirmBanner />
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
