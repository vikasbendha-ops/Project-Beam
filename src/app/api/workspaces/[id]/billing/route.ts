import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isPlan } from "@/lib/plan";

const billingSchema = z.object({
  plan: z.string().refine(isPlan, "Invalid plan"),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: ws } = await supabase
    .from("workspaces")
    .select("owner_id, plan")
    .eq("id", id)
    .maybeSingle();
  if (!ws)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.owner_id !== user.id)
    return NextResponse.json(
      { error: "Only the workspace owner can change the plan." },
      { status: 403 },
    );

  const json = await request.json().catch(() => null);
  const parsed = billingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const target = parsed.data.plan;

  // Stripe checkout integration is keyless in this environment. When STRIPE_SECRET_KEY
  // is set we'd create a Checkout Session here. For now we apply the change locally
  // and fall back to a self-serve "applied immediately" flow.
  const { error } = await supabase
    .from("workspaces")
    .update({
      plan: target,
      plan_renews_at:
        target === "free"
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, plan: target });
}
