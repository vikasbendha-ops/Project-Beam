"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface InviteAcceptFormProps {
  token: string;
  workspaceId: string;
  emailMismatch: { invited: string; current: string } | null;
}

export function InviteAcceptForm({
  token,
  workspaceId,
  emailMismatch,
}: InviteAcceptFormProps) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function accept() {
    setWorking(true);
    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
    });
    setWorking(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't accept invite");
      return;
    }
    toast.success("You're in.");
    router.replace(`/w/${workspaceId}`);
  }

  return (
    <div className="flex flex-col gap-4">
      {emailMismatch ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            This invite was sent to{" "}
            <span className="font-semibold">{emailMismatch.invited}</span>, but
            you're signed in as{" "}
            <span className="font-semibold">{emailMismatch.current}</span>.
            Accepting will add your current account to the workspace.
          </p>
        </div>
      ) : null}
      <Button type="button" onClick={accept} disabled={working} className="h-11">
        {working ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Accepting…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            Accept invite
          </>
        )}
      </Button>
    </div>
  );
}
