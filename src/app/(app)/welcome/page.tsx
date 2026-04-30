import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, UploadCloud } from "lucide-react";
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

  // Fetch personal workspace + display name (created by DB trigger on signup)
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
    // Trigger should have run — fallback message rather than crash.
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
  const dashboardHref = `/w/${workspace.id}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-2xl">
        <header className="mb-12">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Welcome, {firstName}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Your personal workspace is ready. Drop in your first file or URL to
            start collecting feedback.
          </p>
        </header>

        <div className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Link
            href={`${dashboardHref}?new=website`}
            className="group flex flex-col items-center justify-center rounded-[14px] border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <Globe className="size-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Add a website
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter any public URL to start reviewing.
            </p>
          </Link>

          <Link
            href={`${dashboardHref}?new=file`}
            className="group flex flex-col items-center justify-center rounded-[14px] border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform group-hover:scale-105">
              <UploadCloud className="size-6" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Upload a file
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Images, PDFs, and design files.
            </p>
          </Link>
        </div>

        <Link
          href={dashboardHref}
          className="inline-block rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        >
          I&rsquo;ll do this later
        </Link>
      </div>
    </main>
  );
}
