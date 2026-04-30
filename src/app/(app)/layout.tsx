import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Protected app layout.
 * Middleware already redirects unauthenticated users — this is a defence-in-depth
 * server check so RSCs always have a `user`.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <>{children}</>;
}
