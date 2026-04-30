import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type ProbeState = "confirmed" | "unconfirmed" | "unknown";

/**
 * Returns whether an email is registered + confirmed.
 *
 * Used by the signup form to adapt UI when Supabase's silent
 * "this email already exists" response fires:
 *   - confirmed   → offer Log in / Reset password
 *   - unconfirmed → offer Resend verification
 *   - unknown     → fall back to generic copy
 *
 * Note: signUp itself already leaks "exists" via empty `identities`, so
 * this endpoint adds no new enumeration exposure for that branch.
 */
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(parsed.data.email)}`;
  const res = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json<{ state: ProbeState }>({ state: "unknown" });
  }

  const body = (await res.json()) as {
    users?: { email?: string | null; email_confirmed_at?: string | null }[];
  };

  const target = parsed.data.email;
  const match = body.users?.find(
    (u) => u.email?.toLowerCase() === target,
  );

  if (!match) {
    return NextResponse.json<{ state: ProbeState }>({ state: "unknown" });
  }

  return NextResponse.json<{ state: ProbeState }>({
    state: match.email_confirmed_at ? "confirmed" : "unconfirmed",
  });
}
