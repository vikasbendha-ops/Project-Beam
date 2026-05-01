import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = createWorkspaceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      name: parsed.data.name,
      owner_id: user.id,
      is_personal: false,
      plan: "free",
    })
    .select("id, name")
    .single();

  if (error || !workspace)
    return NextResponse.json(
      { error: error?.message ?? "Couldn't create workspace" },
      { status: 500 },
    );

  // Owner is automatically a member.
  await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: "owner",
    invited_by: user.id,
  });

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    redirect: `/w/${workspace.id}`,
  });
}
