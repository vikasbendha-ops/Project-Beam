"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Building2,
  ImagePlus,
  Loader2,
  LogOut,
  Plug,
  Trash2,
  User,
  Webhook,
  X,
} from "lucide-react";
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

type Tab =
  | "profile"
  | "workspace"
  | "notifications"
  | "integrations"
  | "webhooks"
  | "audit"
  | "danger";

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
    { id: "integrations", label: "Integrations", icon: Plug },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "audit", label: "Audit log", icon: Activity },
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
          {tab === "integrations" ? <IntegrationsTab /> : null}
          {tab === "webhooks" ? <WebhooksTab /> : null}
          {tab === "audit" ? (
            <AuditLogTab workspaceId={workspace.id} />
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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const initials = workspace.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  async function uploadAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file (PNG/JPG/WebP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2 MB).");
      return;
    }
    setUploading(true);
    const res = await fetch(`/api/workspaces/${workspace.id}/avatar`, {
      method: "POST",
      headers: { "content-type": file.type },
      body: file,
    });
    setUploading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Avatar upload failed");
      return;
    }
    toast.success("Avatar updated");
    router.refresh();
  }

  async function clearAvatar() {
    setUploading(true);
    const res = await fetch(`/api/workspaces/${workspace.id}/avatar`, {
      method: "DELETE",
    });
    setUploading(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      toast.error(error ?? "Couldn't remove avatar");
      return;
    }
    toast.success("Avatar removed");
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
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border border-border">
          {workspace.avatar_url ? (
            <AvatarImage src={workspace.avatar_url} alt={workspace.name} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
            {initials || "W"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={!isOwner || uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {workspace.avatar_url ? "Change avatar" : "Upload avatar"}
            </Button>
            {workspace.avatar_url ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAvatar}
                disabled={!isOwner || uploading}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] text-muted-foreground">
            PNG, JPG, or WebP · up to 2 MB · square works best.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadAvatar(f);
            e.target.value = "";
          }}
        />
      </div>

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

/* -------- Integrations (stub for upcoming features) -------- */

function IntegrationsTab() {
  // Curated set of upcoming connectors. Each renders as a card with a
  // disabled "Connect" affordance + "Coming soon" pill so the surface
  // feels real but doesn't promise anything we haven't built yet.
  const items: Array<{
    name: string;
    blurb: string;
    glyph: string;
    soon?: boolean;
  }> = [
    {
      name: "Slack",
      blurb: "Push @-mentions and resolve events into a channel.",
      glyph: "S",
      soon: true,
    },
    {
      name: "Linear",
      blurb: "Convert resolved threads into Linear issues with one click.",
      glyph: "L",
      soon: true,
    },
    {
      name: "Figma",
      blurb: "Embed Beam pins on top of any Figma frame.",
      glyph: "F",
      soon: true,
    },
    {
      name: "Zapier",
      blurb: "Trigger zaps from any approve / status-change event.",
      glyph: "Z",
      soon: true,
    },
  ];
  return (
    <Card
      title="Integrations"
      description="Hook Beam into the tools your team already lives in."
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li
            key={it.name}
            className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {it.glyph}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {it.name}
                </p>
                {it.soon ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Soon
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{it.blurb}</p>
              <button
                type="button"
                disabled
                className="mt-3 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* -------- Webhooks (read-only placeholder) -------- */

function WebhooksTab() {
  return (
    <Card
      title="Webhooks"
      description="Send signed POSTs to your endpoint when MarkUps move through review."
    >
      <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center">
        <Webhook
          className="mx-auto size-7 text-muted-foreground"
          strokeWidth={1.25}
        />
        <p className="mt-3 text-sm font-semibold text-foreground">
          No webhooks yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Webhook subscriptions ship in the next release. We&rsquo;ll fire on
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            markup.approved
          </code>
          ,{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            thread.resolved
          </code>
          , and{" "}
          <code className="mx-1 rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            comment.created
          </code>
          .
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:cursor-not-allowed"
        >
          Add endpoint
        </button>
      </div>
    </Card>
  );
}

/* -------- Audit log -------- */

interface AuditRow {
  id: string;
  type: string;
  created_at: string | null;
  content_preview: string | null;
  triggered_by_name: string | null;
  markup_title: string | null;
}

function AuditLogTab({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}/audit?limit=120`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { rows: AuditRow[] };
        if (!cancelled) setRows(json.rows);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <Card
      title="Audit log"
      description="Every status change, approve, share, and comment dispatch in this workspace."
    >
      {error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : rows == null ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-background/50 px-4 py-10 text-center text-sm text-muted-foreground">
          No activity yet.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-background">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
            >
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {r.created_at
                  ? new Date(r.created_at).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : ""}
              </span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-foreground">
                  {r.triggered_by_name ?? "Someone"}
                </span>{" "}
                <span className="text-muted-foreground">{verbFor(r.type)}</span>
                {r.markup_title ? (
                  <span className="font-medium text-foreground">
                    {" "}
                    {r.markup_title}
                  </span>
                ) : null}
                {r.content_preview ? (
                  <span className="text-muted-foreground/80">
                    {" "}
                    — {r.content_preview}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function verbFor(type: string): string {
  switch (type) {
    case "comment":
      return "commented on";
    case "mention":
      return "mentioned someone in";
    case "reply":
      return "replied on";
    case "resolve":
      return "resolved a thread on";
    case "status_change":
      return "changed status of";
    case "share":
      return "shared";
    case "invite":
      return "invited a teammate to";
    case "approve":
      return "approved";
    default:
      return "updated";
  }
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
