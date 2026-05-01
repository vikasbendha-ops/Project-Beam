import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WelcomeCarousel } from "@/components/onboarding/welcome-carousel";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome · Beam",
};

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch personal workspace + display name (created by DB trigger on signup).
  const [{ data: workspace }, { data: profile }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .eq("is_personal", true)
      .maybeSingle(),
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
  ]);

  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md rounded-[14px] border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-bold">We&rsquo;re setting things up…</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hang tight — your workspace is being provisioned. Refresh in a
            moment.
          </p>
        </div>
      </div>
    );
  }

  const firstName = (profile?.name ?? user.email ?? "there").split(" ")[0];

  return (
    <WelcomeCarousel firstName={firstName} workspaceId={workspace.id} />
  );
}
