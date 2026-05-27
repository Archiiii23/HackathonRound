import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/app/StatusBadge";
import { useTheme, type ThemeMode } from "@/components/app/ThemeProvider";
import {
  invitesQuery,
  meQuery,
  notificationsQuery,
  projectsQuery,
  qk,
  workspaceSummaryQuery,
} from "@/lib/queries";
import { api, formatRelative, type NotificationRow } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Bell,
  Activity,
  CheckCheck,
  X,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Monitor,
  LogOut,
  KeyRound,
  Shield,
  HelpCircle,
  Copy,
  Mail,
  Send,
  Sparkles,
  UserPlus,
  Link as LinkIcon,
  Github,
  Linkedin,
  ExternalLink,
  AtSign,
  UserCheck,
  ArrowRight,
} from "lucide-react";

/* ============================================================
 *  Notifications / Activity sheet
 * ============================================================ */

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  mention: AtSign,
  assignment: UserCheck,
  status_change: Activity,
  invite: UserPlus,
  comment: Bell,
};

export function NotificationsSheet({
  open,
  onOpenChange,
  title = "Notifications",
  description = "Mentions, assignments, and status updates.",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const notifications = useQuery(notificationsQuery(50));
  const projects = useQuery(projectsQuery());

  const all = notifications.data?.notifications ?? [];
  const unreadCount = notifications.data?.unread ?? 0;

  const markOne = useMutation({
    mutationFn: (id: string) => api.readNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifications }),
  });
  const markAll = useMutation({
    mutationFn: () => api.readAllNotifications(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.notifications }),
  });

  function handleClick(n: NotificationRow) {
    if (!n.readAt) markOne.mutate(n.id);
    if (n.targetType === "task" && n.projectId) {
      const project = (projects.data?.projects ?? []).find((p) => p.id === n.projectId);
      if (project) {
        navigate({
          to: "/app/projects/$projectId/board",
          params: { projectId: project.slug },
          search: { task: n.targetId },
        });
        onOpenChange(false);
      }
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">{title}</h2>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {unreadCount}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              markAll.mutate(undefined, {
                onSuccess: () => toast.success("All caught up"),
              });
            }}
            disabled={unreadCount === 0 || markAll.isPending}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {notifications.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-14 rounded-lg" />
              ))}
            </div>
          ) : all.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted-foreground">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Activity className="h-5 w-5" />
              </span>
              You're all caught up
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {all.map((n) => {
                const isUnread = !n.readAt;
                const Icon = KIND_ICON[n.kind] ?? Bell;
                return (
                  <li
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/40",
                      isUnread && "bg-primary/[0.03]",
                    )}
                  >
                    {n.actor ? (
                      <Avatar initials={n.actor.initials} color={n.actor.avatarColor} size={30} />
                    ) : (
                      <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 leading-snug">
                        <Icon className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{n.title}</span>
                      </div>
                      {n.body && (
                        <div className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">
                          {n.body}
                        </div>
                      )}
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatRelative(n.createdAt)}</span>
                        <span className="rounded bg-muted px-1.5 py-px text-[10px] uppercase tracking-wide">
                          {n.kind.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    {isUnread && (
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-border bg-muted/20 px-5 py-2.5 text-[11px] text-muted-foreground">
          <span>Showing the latest {all.length}</span>
          <button
            onClick={() => {
              navigate({ to: "/app" });
              onOpenChange(false);
            }}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            Activity feed <ArrowRight className="h-3 w-3" />
          </button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

/* ============================================================
 *  Settings sheet
 * ============================================================ */

export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { mode, setMode } = useTheme();
  const me = useQuery(meQuery());
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const user = me.data?.user;

  const [density, setDensity] = React.useState<"comfy" | "compact">("comfy");
  const [emailNotif, setEmailNotif] = React.useState(true);
  const [productUpdates, setProductUpdates] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const d = window.localStorage.getItem("devcollab:density");
      if (d === "compact" || d === "comfy") setDensity(d);
      const e = window.localStorage.getItem("devcollab:email-notif");
      if (e !== null) setEmailNotif(e === "1");
      const p = window.localStorage.getItem("devcollab:product-updates");
      if (p !== null) setProductUpdates(p === "1");
    } catch {
      /* noop */
    }
  }, []);

  function saveDensity(v: "comfy" | "compact") {
    setDensity(v);
    try {
      window.localStorage.setItem("devcollab:density", v);
    } catch {
      /* noop */
    }
    toast.success(`Density: ${v === "comfy" ? "Comfortable" : "Compact"}`);
  }

  function saveEmail(v: boolean) {
    setEmailNotif(v);
    try {
      window.localStorage.setItem("devcollab:email-notif", v ? "1" : "0");
    } catch {
      /* noop */
    }
    toast.success(v ? "Email notifications on" : "Email notifications off");
  }

  function saveProduct(v: boolean) {
    setProductUpdates(v);
    try {
      window.localStorage.setItem("devcollab:product-updates", v ? "1" : "0");
    } catch {
      /* noop */
    }
    toast.success(v ? "Product updates on" : "Product updates off");
  }

  async function logout() {
    await api.logout().catch(() => {});
    queryClient.setQueryData(qk.me, { user: null });
    await router.invalidate();
    onOpenChange(false);
    toast.success("Signed out");
    navigate({ to: "/login" });
  }

  if (!user) return null;

  const modes: {
    id: ThemeMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Settings</h2>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Preferences and account controls.
          </p>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {/* Account */}
          <section>
            <SectionLabel>Account</SectionLabel>
            <div className="surface-card flex items-center gap-3 p-3">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ background: user.avatarColor }}
              >
                {user.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
              </div>
            </div>
          </section>

          {/* Theme */}
          <section>
            <SectionLabel>Appearance</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMode(m.id);
                      toast.success(`Theme: ${m.label}`);
                    }}
                    className={cn(
                      "surface-card flex flex-col items-center gap-1.5 p-3 text-xs font-medium transition-all",
                      active
                        ? "border-primary/40 bg-primary/[0.04] shadow-[var(--shadow-soft)]"
                        : "hover:border-foreground/20",
                    )}
                  >
                    <m.icon
                      className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")}
                    />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Density */}
          <section>
            <SectionLabel>Density</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {(["comfy", "compact"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => saveDensity(d)}
                  className={cn(
                    "surface-card p-3 text-left text-xs transition-all",
                    density === d
                      ? "border-primary/40 bg-primary/[0.04] shadow-[var(--shadow-soft)]"
                      : "hover:border-foreground/20",
                  )}
                >
                  <div className="font-semibold">{d === "comfy" ? "Comfortable" : "Compact"}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d === "comfy" ? "More breathing room" : "Higher info density"}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section>
            <SectionLabel>Notifications</SectionLabel>
            <div className="space-y-2">
              <ToggleRow
                icon={Mail}
                label="Email notifications"
                description="Get a daily digest of mentions and assigned tasks."
                checked={emailNotif}
                onChange={saveEmail}
              />
              <ToggleRow
                icon={Sparkles}
                label="Product updates"
                description="Hear about new AI features and improvements."
                checked={productUpdates}
                onChange={saveProduct}
              />
            </div>
          </section>

          {/* Quick links */}
          <section>
            <SectionLabel>Security</SectionLabel>
            <div className="space-y-1.5">
              <ActionRow
                icon={KeyRound}
                label="Change password"
                onClick={() => toast.info("Password reset email sent (demo)")}
              />
              <ActionRow
                icon={Shield}
                label="Active sessions"
                onClick={() => toast.info("1 active session on this device")}
              />
              <ActionRow
                icon={HelpCircle}
                label="Help & docs"
                onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
                external
              />
            </div>
          </section>
        </div>

        <footer className="border-t border-border bg-muted/20 px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="surface-card flex w-full items-center gap-3 p-3 text-left transition-all hover:border-foreground/20"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[19px]" : "translate-x-[3px]",
          )}
        />
      </span>
    </button>
  );
}

function ActionRow({
  icon: Icon,
  label,
  onClick,
  external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  external?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {external ? (
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      ) : (
        <span className="text-xs text-muted-foreground">→</span>
      )}
    </button>
  );
}

/* ============================================================
 *  Invite dialog
 * ============================================================ */

export function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const me = useQuery(meQuery());
  const summary = useQuery(workspaceSummaryQuery());
  const existingInvites = useQuery({ ...invitesQuery(), enabled: open });
  const queryClient = useQueryClient();
  const user = me.data?.user;
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<"member" | "admin" | "viewer">("member");
  const [shareToken, setShareToken] = React.useState<string | null>(null);

  // Reuse the most recent unaccepted invite (if any) for the share link.
  React.useEffect(() => {
    if (!open) return;
    const pending = (existingInvites.data?.invites ?? []).find((i) => !i.acceptedAt);
    if (pending) setShareToken(pending.token);
  }, [existingInvites.data, open]);

  const createInvite = useMutation({
    mutationFn: (input: { email: string; role: "member" | "admin" | "viewer" }) =>
      api.createInvite(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.invites });
    },
  });

  const inviteUrl = React.useMemo(() => {
    if (typeof window === "undefined" || !shareToken) return "";
    return `${window.location.origin}/signup?invite=${encodeURIComponent(shareToken)}`;
  }, [shareToken]);

  function copyLink() {
    if (!inviteUrl) {
      toast.info("Send an invite first to generate a link.");
      return;
    }
    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => toast.success("Invite link copied"))
      .catch(() => toast.error("Couldn't copy"));
  }

  async function sendInvites(e: React.FormEvent) {
    e.preventDefault();
    const list = emails
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^\S+@\S+\.\S+$/.test(s));
    if (list.length === 0) {
      toast.error("Add at least one valid email");
      return;
    }
    try {
      let lastToken: string | null = null;
      for (const email of list) {
        const res = await createInvite.mutateAsync({ email, role });
        lastToken = res.token;
      }
      if (lastToken) setShareToken(lastToken);
      toast.success(`Invited ${list.length} ${list.length === 1 ? "teammate" : "teammates"}`);
      setEmails("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send invites";
      toast.error(msg);
    }
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[520px]" showCloseButton={false}>
        <div className="border-b border-border bg-muted/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <h2 className="font-display text-base font-semibold">Invite teammates</h2>
              <p className="text-[11px] text-muted-foreground">
                Up to {summary.data?.memberCount ? Math.max(5, summary.data.memberCount + 5) : 5}{" "}
                people on the free plan.
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="text-xs font-medium">Invite link</label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 text-xs text-muted-foreground">
                <LinkIcon className="h-3.5 w-3.5" />
                <span className="truncate font-mono">{inviteUrl}</span>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={copyLink}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Anyone with this link can join your workspace.
            </p>
          </div>

          <form onSubmit={sendInvites} className="space-y-3">
            <div>
              <label className="text-xs font-medium" htmlFor="invite-emails">
                Invite by email
              </label>
              <textarea
                id="invite-emails"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="alex@company.com, jamie@company.com"
                rows={3}
                className="mt-1.5 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium">Role</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "viewer", title: "Viewer", sub: "Read-only access" },
                    { id: "member", title: "Member", sub: "View & edit content" },
                    { id: "admin", title: "Admin", sub: "Plus billing & members" },
                  ] as const
                ).map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "surface-card p-3 text-left text-xs transition-all",
                      role === r.id
                        ? "border-primary/40 bg-primary/[0.04] shadow-[var(--shadow-soft)]"
                        : "hover:border-foreground/20",
                    )}
                  >
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-[11px] text-muted-foreground">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-muted-foreground">
                Invites expire after 14 days.
              </span>
              <Button type="submit" size="sm" className="gap-1.5" disabled={createInvite.isPending}>
                <Send className="h-3.5 w-3.5" />
                {createInvite.isPending ? "Sending…" : "Send invites"}
              </Button>
            </div>
          </form>

          <div className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
            Tip: paste a comma-separated list to invite multiple people at once.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
 *  Legal / info dialog
 * ============================================================ */

export type LegalDocKey =
  | "terms"
  | "privacy"
  | "security"
  | "changelog"
  | "about"
  | "careers"
  | "contact"
  | "features"
  | "forgot";

const LEGAL_CONTENT: Record<LegalDocKey, { title: string; description: string; body: string }> = {
  terms: {
    title: "Terms of Service",
    description: "Effective May 2026",
    body: `By using DevCollab you agree to use the service for lawful purposes and not to attempt to disrupt other workspaces. Your data remains yours. We may suspend accounts that abuse our infrastructure or violate other users' rights.

This is a demo project — the full legal text would live here.`,
  },
  privacy: {
    title: "Privacy Policy",
    description: "Effective May 2026",
    body: `We store only the data required to run the product: account, projects, tasks, wiki, snippets, activity. We don't sell your data. AI prompts are processed by the provider you select.

This is a demo project — the full privacy policy would live here.`,
  },
  security: {
    title: "Security",
    description: "How we keep your workspace safe",
    body: `• Data encrypted in transit (TLS) and at rest.
• Cookies are http-only with SameSite=Lax.
• Role-based access enforced server-side.
• SOC 2 Type II audit completed Q1 2026.
• Disclosure: security@devcollab.app`,
  },
  changelog: {
    title: "What's new",
    description: "DevCollab v1.4 — May 2026",
    body: `• AI Standup is now generally available.
• Kanban board got a faster drag & drop with column metrics.
• New global Command Palette (⌘K) with fuzzy search.
• Wiki has dual-pane preview and autosave.
• Snippet sharing via deep link.`,
  },
  about: {
    title: "About DevCollab",
    description: "Built for engineering teams",
    body: `DevCollab unifies tasks, docs, and snippets so engineering teams don't have to context-switch across five tools to ship one feature.

We're a small remote team based across the US and EU.`,
  },
  careers: {
    title: "Careers",
    description: "We're hiring — fully remote",
    body: `Open roles:
• Senior Product Engineer (TypeScript)
• Design Engineer (Figma + React)
• Developer Advocate

Email careers@devcollab.app to apply.`,
  },
  contact: {
    title: "Contact us",
    description: "We typically reply within a business day",
    body: `General: hello@devcollab.app
Sales:   sales@devcollab.app
Support: support@devcollab.app
Security: security@devcollab.app`,
  },
  features: {
    title: "Features",
    description: "Everything in DevCollab",
    body: `• Kanban board with drag & drop, urgent metrics, inline quick-add.
• List view with bulk actions, sorting, density toggle.
• Wiki with live markdown preview and autosave.
• Snippets with syntax tones, copy-line, share links.
• AI Hub with multi-model routing and streaming responses.
• Global ⌘K palette and keyboard shortcuts.
• Dark / light / system theming with no FOUC.`,
  },
  forgot: {
    title: "Reset your password",
    description: "We'll send instructions to your inbox",
    body: `Drop us a note at support@devcollab.app and we'll walk you through resetting your password.

This is a demo build — the full self-serve reset flow is on the roadmap.`,
  },
};

export function LegalDialog({
  doc,
  onOpenChange,
}: {
  doc: LegalDocKey | null;
  onOpenChange: (v: boolean) => void;
}) {
  const content = doc ? LEGAL_CONTENT[doc] : null;
  return (
    <Dialog open={!!doc} onOpenChange={(v) => onOpenChange(v)}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[560px]" showCloseButton={false}>
        {content && (
          <>
            <div className="flex items-start justify-between border-b border-border bg-muted/20 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold">{content.title}</h2>
                <p className="text-[11px] text-muted-foreground">{content.description}</p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-5">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {content.body}
              </pre>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/20 px-5 py-3 text-[11px] text-muted-foreground">
              <span>Questions? hello@devcollab.app</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Github className="h-3 w-3" /> GitHub
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  <Linkedin className="h-3 w-3" /> LinkedIn
                </a>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
