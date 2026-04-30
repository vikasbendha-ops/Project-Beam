"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  MoreHorizontal,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MemberRow {
  user_id: string;
  role: "owner" | "member" | "guest";
  joined_at: string;
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

interface InviteRow {
  id: string;
  email: string;
  role: "owner" | "member" | "guest";
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
  invited_by: string | null;
}

interface PeopleViewProps {
  workspace: {
    id: string;
    name: string;
    owner_id: string;
    is_personal: boolean;
  };
  members: MemberRow[];
  invites: InviteRow[];
  currentUserId: string;
}

export function PeopleView({
  workspace,
  members,
  invites,
  currentUserId,
}: PeopleViewProps) {
  const router = useRouter();
  const isOwner = workspace.owner_id === currentUserId;
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<"member" | "guest">("member");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function commitDraft() {
    const v = draft.trim().toLowerCase();
    if (!v) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error("Enter a valid email");
      return;
    }
    if (emails.includes(v)) {
      setDraft("");
      return;
    }
    setEmails((xs) => [...xs, v]);
    setDraft("");
  }

  async function sendInvites() {
    if (draft.trim()) commitDraft();
    if (emails.length === 0) {
      toast.error("Add at least one email");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspace_id: workspace.id,
        emails,
        role,
        message: message.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't send invites");
      return;
    }
    const body = (await res.json()) as {
      sent: string[];
      failed: { email: string; error: string }[];
    };
    if (body.sent.length > 0)
      toast.success(`Invited ${body.sent.length}`);
    if (body.failed.length > 0)
      toast.error(`Failed ${body.failed.length}: ${body.failed[0]?.error}`);
    setEmails([]);
    setMessage("");
    router.refresh();
  }

  async function changeRole(userId: string, newRole: "member" | "guest") {
    const res = await fetch(
      `/api/workspaces/${workspace.id}/members/${userId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      },
    );
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't change role");
      return;
    }
    toast.success("Role updated");
    router.refresh();
  }

  async function removeMember(userId: string, name: string) {
    if (!window.confirm(`Remove ${name} from this workspace?`)) return;
    const res = await fetch(
      `/api/workspaces/${workspace.id}/members/${userId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't remove member");
      return;
    }
    toast.success("Removed");
    router.refresh();
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          People
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {members.length} {members.length === 1 ? "member" : "members"} in{" "}
          <span className="font-semibold text-foreground">
            {workspace.name}
          </span>
          {invites.length > 0 ? (
            <>
              {" · "}
              <span>
                {invites.length} pending{" "}
                {invites.length === 1 ? "invite" : "invites"}
              </span>
            </>
          ) : null}
        </p>
      </header>

      {isOwner ? (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserPlus className="size-4" /> Invite people
          </h2>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              {emails.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1 rounded-md bg-card px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm"
                >
                  {e}
                  <button
                    type="button"
                    onClick={() =>
                      setEmails((xs) => xs.filter((x) => x !== e))
                    }
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${e}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    commitDraft();
                  }
                  if (e.key === "Backspace" && !draft && emails.length) {
                    setEmails((xs) => xs.slice(0, -1));
                  }
                }}
                onBlur={commitDraft}
                placeholder="Add emails (Enter to confirm)…"
                className="min-w-[160px] flex-1 bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
              />
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "member" | "guest")
                }
                className="rounded-md border border-border bg-card px-2 py-1 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="member">Member</option>
                <option value="guest">Guest reviewer</option>
              </select>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add an optional message…"
              rows={2}
              className="mt-3 w-full resize-none rounded-md border border-border bg-card p-2 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              maxLength={500}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                onClick={sendInvites}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Send invites
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <header className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-foreground">Members</h2>
        </header>
        <ul className="divide-y divide-border">
          {members.map((m) => {
            const name = m.profile?.name ?? "Unknown";
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();
            const isMe = m.user_id === currentUserId;
            const isWorkspaceOwner = m.user_id === workspace.owner_id;
            return (
              <li
                key={m.user_id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30"
              >
                <Avatar className="size-9 border border-border">
                  {m.profile?.avatar_url ? (
                    <AvatarImage src={m.profile.avatar_url} alt={name} />
                  ) : null}
                  <AvatarFallback className="bg-accent text-[11px] font-bold text-accent-foreground">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {name}
                    {isMe ? (
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {m.profile?.email ?? "—"} · joined{" "}
                    {formatDistanceToNow(new Date(m.joined_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                    isWorkspaceOwner
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {m.role}
                </span>
                {isOwner && !isWorkspaceOwner ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Member actions"
                    >
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          changeRole(
                            m.user_id,
                            m.role === "guest" ? "member" : "guest",
                          )
                        }
                      >
                        Change to{" "}
                        {m.role === "guest" ? "Member" : "Guest reviewer"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => removeMember(m.user_id, name)}
                      >
                        <Trash2 className="size-4" />
                        Remove from workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {invites.length > 0 ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <header className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Pending invites
            </h2>
          </header>
          <ul className="divide-y divide-border">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Mail className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {inv.email}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Sent{" "}
                    {formatDistanceToNow(new Date(inv.created_at), {
                      addSuffix: true,
                    })}
                    {inv.expires_at
                      ? ` · expires ${format(new Date(inv.expires_at), "MMM d")}`
                      : ""}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-amber-800">
                  {inv.role} · pending
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
