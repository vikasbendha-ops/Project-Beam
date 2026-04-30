import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/auth/auth-card";
import { InviteAcceptForm } from "@/components/auth/invite-accept-form";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Accept invite · Beam",
};

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const service = createServiceClient();
  const { data: invite } = await service
    .from("workspace_invites")
    .select(
      "id, workspace_id, email, role, expires_at, accepted_at, invited_by, workspaces!inner ( name ), profiles:invited_by ( name )",
    )
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return (
      <AuthCard
        title="Invite not found"
        subtitle="This link doesn't match an active workspace invite. Ask the sender to re-send it."
      >
        <Button asChild variant="outline" className="mt-2">
          <Link href="/login">Go to log in</Link>
        </Button>
      </AuthCard>
    );
  }

  const isExpired =
    !!invite.expires_at && new Date(invite.expires_at) < new Date();
  if (invite.accepted_at) {
    return (
      <AuthCard
        title="Already accepted"
        subtitle="This invite has been used. Ask the workspace owner to re-invite you if you can't access it."
      >
        <Button asChild className="mt-2">
          <Link href={`/w/${invite.workspace_id}`}>Open workspace</Link>
        </Button>
      </AuthCard>
    );
  }
  if (isExpired) {
    return (
      <AuthCard
        title="Invite expired"
        subtitle="The link is no longer valid. Ask the sender for a fresh invite."
      >
        <Button asChild variant="outline" className="mt-2">
          <Link href="/login">Go to log in</Link>
        </Button>
      </AuthCard>
    );
  }

  // Authenticated? Show the accept CTA. Anonymous? Send to login with
  // ?next=/invites/<token> so they bounce back here after auth.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent(`/invites/${token}`);
    return (
      <AuthCard
        title={`Join ${invite.workspaces?.name ?? "the workspace"}`}
        subtitle={
          invite.profiles?.name
            ? `${invite.profiles.name} invited you to collaborate on Beam.`
            : `You've been invited to collaborate on Beam.`
        }
        footer={
          <>
            New here?{" "}
            <Link
              href={`/signup?next=${next}`}
              className="font-semibold text-primary hover:underline"
            >
              Create an account
            </Link>
          </>
        }
      >
        <Button asChild>
          <Link href={`/login?next=${next}&email=${encodeURIComponent(invite.email)}`}>
            Log in to accept
          </Link>
        </Button>
      </AuthCard>
    );
  }

  // Already accepted by this user? jump straight in.
  const { data: existing } = await service
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect(`/w/${invite.workspace_id}`);
  }

  return (
    <AuthCard
      title={`Join ${invite.workspaces?.name ?? "the workspace"}`}
      subtitle={
        invite.profiles?.name
          ? `${invite.profiles.name} invited you as a ${invite.role}. Accept to start collaborating.`
          : `You've been invited as a ${invite.role}.`
      }
    >
      <InviteAcceptForm
        token={token}
        workspaceId={invite.workspace_id}
        emailMismatch={
          invite.email !== (user.email ?? "").toLowerCase()
            ? { invited: invite.email, current: user.email ?? "" }
            : null
        }
      />
    </AuthCard>
  );
}
