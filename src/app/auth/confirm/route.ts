import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-OTP confirm endpoint.
 * Supabase email templates point here with `?token_hash=...&type=signup` or
 * `type=recovery`, etc. We verify the OTP and start a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      // Recovery → user must set a new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      // Signup confirmed → drop them on welcome (or `next` if provided)
      return NextResponse.redirect(`${origin}${next ?? "/welcome"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
