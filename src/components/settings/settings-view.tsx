"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Building2, Loader2, LogOut, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  workspace: {
    id: string;
    name: string;
    owner_id: string;
    is_personal: boolean;
    avatar_url: string | null;
  };
  profile: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    timezone: string | null;
  };
  preferences: {
    email_digest_frequency: "off" | "realtime" | "daily" | "weekly";
    markup_notifications_default: "all" | "mentions" | "off";
    browser_push_enabled: boolean;
  };
  isOwner: boolean;
}

type Tab = "profile" | "workspace" | "notifications" | "danger";

export function SettingsView({
  workspace,
  profile,
  preferences,
  isOwner,
}: SettingsViewProps) {
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "workspace", label: "Workspace", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "danger", label: "Danger zone", icon: Trash2 },
  ];

  return (
    <div className="px-4 py-6 md:px-8 md:py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, workspace, and notifications.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-2 shadow-card lg:flex-col">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-accent text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <t.icon className="size-4" strokeWidth={1.5} />
              {t.label}
            </button>
          ))}
        </nav>

        <main>
          {tab === "profile" ? <ProfileTab profile={profile} /> : null}
          {tab === "workspace" ? (
            <WorkspaceTab
              workspace={workspace}
              isOwner={isOwner}
            />
          ) : null}
          {tab === "notifications" ? (
            <NotificationsTab preferences={preferences} />
          ) : null}
          {tab === "danger" ? (
            <DangerTab workspace={workspace} isOwner={isOwner} />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
}: {
  profile: SettingsViewProps["profile"];
}) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const initials = (name || profile.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function save() {
    if (!name.trim() || name.trim() === profile.name) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't save");
      return;
    }
    toast.success("Profile updated");
    router.refresh();
  }

  return (
    <Card title="Your profile" description="Visible to everyone you collaborate with.">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.name} />
          ) : null}
          <AvatarFallback className="bg-accent text-base font-bold text-accent-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{profile.email}</p>
          <p className="text-xs text-muted-foreground">
            Email changes require contacting support.
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={save}
          disabled={saving || !name.trim() || name.trim() === profile.name}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
      </div>
    </Card>
  );
}

function WorkspaceTab({
  workspace,
  isOwner,
}: {
  workspace: SettingsViewProps["workspace"];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || name.trim() === workspace.name) return;
    setSaving(true);
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't save");
      return;
    }
    toast.success("Workspace updated");
    router.refresh();
  }

  return (
    <Card
      title="Workspace"
      description={
        workspace.is_personal
          ? "This is your personal workspace."
          : "Settings for this team workspace."
      }
    >
      <div className="grid gap-2">
        <Label htmlFor="ws-name">Workspace name</Label>
        <Input
          id="ws-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={!isOwner}
        />
        {!isOwner ? (
          <p className="text-[11px] text-muted-foreground">
            Only the workspace owner can rename it.
          </p>
        ) : null}
      </div>
      {isOwner ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={save}
            disabled={
              saving || !name.trim() || name.trim() === workspace.name
            }
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function NotificationsTab({
  preferences,
}: {
  preferences: SettingsViewProps["preferences"];
}) {
  const router = useRouter();
  const [digest, setDigest] = useState(preferences.email_digest_frequency);
  const [defaultMode, setDefaultMode] = useState(
    preferences.markup_notifications_default,
  );
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/notification-preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email_digest_frequency: digest,
        markup_notifications_default: defaultMode,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't save");
      return;
    }
    toast.success("Preferences updated");
    router.refresh();
  }

  return (
    <Card
      title="Notifications"
      description="Control which events email you and how often."
    >
      <div className="grid gap-2">
        <Label>Email frequency</Label>
        <select
          value={digest}
          onChange={(e) =>
            setDigest(e.target.value as typeof digest)
          }
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="realtime">Realtime — send every event</option>
          <option value="daily">Daily digest (coming soon)</option>
          <option value="weekly">Weekly digest (coming soon)</option>
          <option value="off">Off — no emails</option>
        </select>
      </div>
      <div className="grid gap-2">
        <Label>Default for new MarkUps</Label>
        <select
          value={defaultMode}
          onChange={(e) =>
            setDefaultMode(e.target.value as typeof defaultMode)
          }
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="all">All comments and replies</option>
          <option value="mentions">Only when I'm @-mentioned</option>
          <option value="off">Nothing</option>
        </select>
        <p className="text-[11px] text-muted-foreground">
          You can override this per-MarkUp later. Mentions always notify
          regardless.
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Save preferences
        </Button>
      </div>
    </Card>
  );
}

function DangerTab({
  workspace,
  isOwner,
}: {
  workspace: SettingsViewProps["workspace"];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function leave() {
    if (
      !window.confirm(
        `Leave the "${workspace.name}" workspace? You'll lose access to all its MarkUps and comments.`,
      )
    )
      return;
    setWorking(true);
    const res = await fetch(`/api/workspaces/${workspace.id}/leave`, {
      method: "POST",
    });
    setWorking(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't leave");
      return;
    }
    toast.success("Left the workspace");
    router.replace("/welcome");
    router.refresh();
  }

  async function deleteWorkspace() {
    if (
      !window.confirm(
        `Delete "${workspace.name}"? This permanently removes every MarkUp, comment, and version. This cannot be undone.`,
      )
    )
      return;
    setWorking(true);
    const res = await fetch(`/api/workspaces/${workspace.id}`, {
      method: "DELETE",
    });
    setWorking(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't delete");
      return;
    }
    toast.success("Workspace deleted");
    router.replace("/welcome");
    router.refresh();
  }

  return (
    <Card
      title="Danger zone"
      description="Irreversible actions. Take a deep breath first."
      tone="danger"
    >
      {!isOwner ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Leave this workspace
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You'll lose access to its MarkUps. The owner can re-invite you
              later.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={leave}
              disabled={working}
              className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {working ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Leave workspace
            </Button>
          </div>
        </div>
      ) : !workspace.is_personal ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <p className="text-sm font-semibold text-destructive">
              Delete workspace
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Permanently deletes the workspace, every MarkUp, version,
              thread, and comment. There is no recovery.
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={deleteWorkspace}
              disabled={working}
            >
              {working ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete workspace
            </Button>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          Personal workspaces can't be deleted while your account exists.
          Email support to delete the whole account.
        </p>
      )}
    </Card>
  );
}

function Card({
  title,
  description,
  children,
  tone,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "danger";
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card",
        tone === "danger" && "border-destructive/40",
      )}
    >
      <header>
        <h2
          className={cn(
            "text-base font-semibold",
            tone === "danger" ? "text-destructive" : "text-foreground",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
