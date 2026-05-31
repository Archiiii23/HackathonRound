import * as React from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  api,
  formatAiProvider,
  type AiPlatform,
  type AiResult,
  type AiStructured,
  type AiSubtask,
} from "@/lib/api";
import { meQuery, projectsQuery, qk } from "@/lib/queries";
import { toast } from "sonner";
import { CommandPaletteProvider, useCommandPalette } from "@/components/app/CommandPalette";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { NotificationsSheet, SettingsSheet, InviteDialog } from "@/components/app/AppPanels";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  BookOpen,
  Code2,
  Bell,
  Activity,
  Sparkles,
  Settings,
  CreditCard,
  Search,
  Plus,
  ChevronsLeft,
  ChevronsRight,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Send,
  RotateCcw,
  Check,
  Loader2,
  Users,
  UserCircle,
  Plug,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  params?: Record<string, string>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
};

const STATIC_NAV: NavItem[] = [
  { to: "/app", label: "Workspace", icon: LayoutDashboard, exact: true },
  { to: "/app/members", label: "Members", icon: Users },
  { to: "/app/integrations", label: "Integrations", icon: Plug },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <CommandPaletteProvider>
      <AppShellInner>{children}</AppShellInner>
    </CommandPaletteProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showAiHub, setShowAiHub] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showInvite, setShowInvite] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const palette = useCommandPalette();

  // Register the AI hub opener with the command palette so /-search can open it
  React.useEffect(() => {
    palette.setOpenAiHub(() => setShowAiHub(true));
  }, [palette]);

  // ⌘J → open AI hub
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setShowAiHub((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        pathname={pathname}
        onOpenAiHub={() => setShowAiHub(true)}
        onToggleCollapse={() => setCollapsed((v) => !v)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-300 ease-out"
        style={{ paddingLeft: collapsed ? 72 : 264 }}
      >
        <TopBar
          onOpenAiHub={() => setShowAiHub(true)}
          onOpenInvite={() => setShowInvite(true)}
          onOpenNotifications={() => setShowNotifications(true)}
        />
        <main className="flex-1 animate-[var(--animate-fade-in)]">{children}</main>
      </div>
      {showAiHub && <AiHubWrapper onClose={() => setShowAiHub(false)} />}

      {showAiHub && <AiHub onClose={() => setShowAiHub(false)} />}
      <NotificationsSheet open={showNotifications} onOpenChange={setShowNotifications} />
      <SettingsSheet open={showSettings} onOpenChange={setShowSettings} />
      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </div>
  );
}

function AiHubWrapper({ onClose }: { onClose: () => void }) {
  const matches = useMatches();
  // Find the match that has projectId in its params
  const projectMatch = matches.find((m) => "projectId" in (m.params as any));
  const projectId = (projectMatch?.params as any)?.projectId;

  return <AiHub onClose={onClose} projectId={projectId} />;
}

function Sidebar({
  collapsed,
  pathname,
  onOpenAiHub,
  onToggleCollapse,
  onOpenNotifications,
  onOpenSettings,
}: {
  collapsed: boolean;
  pathname: string;
  onOpenAiHub: () => void;
  onToggleCollapse: () => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
}) {
  const projects = useQuery(projectsQuery());
  const first = projects.data?.projects[0];
  const [activeProjectExpanded, setActiveProjectExpanded] = React.useState(true);

  const dynamicNav: NavItem[] = first
    ? [
        {
          to: "/app/projects/$projectId",
          params: { projectId: first.slug },
          label: "Overview",
          icon: FolderKanban,
          exact: true,
        },
        {
          to: "/app/projects/$projectId/board",
          params: { projectId: first.slug },
          label: "Board",
          icon: Calendar,
        },
        {
          to: "/app/projects/$projectId/list",
          params: { projectId: first.slug },
          label: "List",
          icon: ListTodo,
        },
        {
          to: "/app/projects/$projectId/calendar",
          params: { projectId: first.slug },
          label: "Calendar",
          icon: Calendar,
        },
        {
          to: "/app/projects/$projectId/wiki",
          params: { projectId: first.slug },
          label: "Wiki",
          icon: BookOpen,
        },
        {
          to: "/app/projects/$projectId/snippets",
          params: { projectId: first.slug },
          label: "Snippets",
          icon: Code2,
        },
      ]
    : [];

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 72 : 264 }}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-3">
        {collapsed ? (
          <Link
            to="/app"
            className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <span className="font-display text-sm font-semibold">D</span>
          </Link>
        ) : (
          <>
            <Logo to="/app" className="px-1" />
            <button
              onClick={onToggleCollapse}
              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarSection collapsed={collapsed} label="Workspace">
          {STATIC_NAV.map((it) => (
            <SidebarItem key={it.to} {...it} collapsed={collapsed} pathname={pathname} />
          ))}
        </SidebarSection>
        {dynamicNav.length > 0 && first && (
          <SidebarSection
            collapsed={collapsed}
            label={
              <button
                onClick={() => setActiveProjectExpanded((v) => !v)}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                {activeProjectExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: first.color }} />
                {first.name}
              </button>
            }
          >
            {activeProjectExpanded &&
              dynamicNav.map((it) => (
                <SidebarItem
                  key={`${it.to}-${it.label}`}
                  {...it}
                  collapsed={collapsed}
                  pathname={pathname}
                />
              ))}
          </SidebarSection>
        )}

        {projects.data && projects.data.projects.length > 1 && !collapsed && (
          <SidebarSection collapsed={collapsed} label="Other projects">
            {projects.data.projects.slice(1, 5).map((p) => (
              <SidebarItem
                key={p.id}
                to="/app/projects/$projectId"
                params={{ projectId: p.slug }}
                label={p.name}
                icon={({ className }) => (
                  <span
                    className={cn("h-2 w-2 shrink-0 rounded-full", className)}
                    style={{ background: p.color }}
                  />
                )}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </SidebarSection>
        )}

        <SidebarSection collapsed={collapsed} label="Explore">
          <SidebarButton
            label="Notifications"
            icon={Bell}
            collapsed={collapsed}
            onClick={onOpenNotifications}
            badgeKey="devcollab:notif-read"
          />
          <SidebarButton
            label="Activity"
            icon={Activity}
            collapsed={collapsed}
            onClick={onOpenNotifications}
          />
          <button
            onClick={onOpenAiHub}
            className="group relative flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            title={collapsed ? "AI Hub" : undefined}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate text-left">AI Hub</span>
                <span className="kbd">⌘J</span>
              </>
            )}
          </button>
        </SidebarSection>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Link
          to="/app/profile"
          className="group relative flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          title={collapsed ? "Profile" : undefined}
        >
          <UserCircle className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 truncate text-left">Profile</span>}
        </Link>
        <Link
          to="/app/billing"
          className="group relative flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          title={collapsed ? "Billing" : undefined}
        >
          <CreditCard className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="flex-1 truncate text-left">Billing</span>}
        </Link>
        <SidebarButton
          label="Settings"
          icon={Settings}
          collapsed={collapsed}
          onClick={onOpenSettings}
        />
        <UserCard collapsed={collapsed} />
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            title="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

function UserCard({ collapsed }: { collapsed: boolean }) {
  const me = useQuery(meQuery());
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const user = me.data?.user;
  if (!user) return null;

  async function logout() {
    await api.logout().catch(() => {});
    queryClient.setQueryData(qk.me, { user: null });
    await router.invalidate();
    toast.success("Signed out");
    navigate({ to: "/login" });
  }

  if (collapsed) {
    return (
      <button
        onClick={logout}
        title={`${user.name} · click to log out`}
        className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-sidebar transition-transform hover:scale-[1.05]"
        style={{ background: user.avatarColor }}
      >
        {user.initials}
      </button>
    );
  }

  return (
    <div className="relative mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-card/50 px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent"
      >
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ background: user.avatarColor }}
        >
          {user.initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{user.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
        </div>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            <div className="px-3 py-2 border-b border-border">
              <div className="font-medium text-sm">{user.name}</div>
              <div className="text-[11px] text-muted-foreground">{user.email}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3.5 w-3.5" /> Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SidebarSection({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      {!collapsed && (
        <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  to,
  params,
  label,
  icon: Icon,
  collapsed,
  pathname,
  exact,
  badge,
}: NavItem & { collapsed: boolean; pathname: string }) {
  const resolved = params
    ? Object.entries(params).reduce((acc, [k, v]) => acc.replace(`$${k}`, v), to)
    : to;
  const active = exact
    ? pathname === resolved
    : pathname === resolved || pathname.startsWith(resolved + "/");
  const base =
    "group relative flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-all duration-150";
  const cls = active
    ? `${base} bg-primary/8 text-foreground font-medium`
    : `${base} text-muted-foreground hover:bg-sidebar-accent hover:text-foreground`;
  return (
    <Link
      to={to as never}
      params={params as never}
      className={cls}
      title={collapsed ? label : undefined}
    >
      {active && (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-primary" aria-hidden />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge ? (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarButton({
  label,
  icon: Icon,
  collapsed,
  onClick,
  badgeKey,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onClick: () => void;
  badgeKey?: string;
}) {
  // Optional: derive an unread count by reading a localStorage key.
  // Stays harmless if there's nothing stored yet.
  const [unread, setUnread] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (!badgeKey || typeof window === "undefined") {
      setUnread(null);
      return;
    }
    function compute() {
      try {
        const raw = window.localStorage.getItem(badgeKey!);
        const read = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
        // Coarse: show "•" indicator until user opens the panel at least once.
        if (!raw) setUnread(3);
        else setUnread(Math.max(0, 3 - read.size > 0 ? 0 : 0));
      } catch {
        setUnread(null);
      }
    }
    compute();
    const onStorage = (e: StorageEvent) => {
      if (e.key === badgeKey) compute();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [badgeKey]);

  return (
    <button
      onClick={onClick}
      className="group relative flex h-9 w-full items-center gap-3 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && unread && unread > 0 ? (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {unread}
        </span>
      ) : null}
    </button>
  );
}

function TopBar({
  onOpenAiHub,
  onOpenInvite,
  onOpenNotifications,
}: {
  onOpenAiHub: () => void;
  onOpenInvite: () => void;
  onOpenNotifications: () => void;
}) {
  const palette = useCommandPalette();

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/70 px-6 backdrop-blur-md">
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => palette.setOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-md border border-input bg-card pl-2.5 pr-1.5 text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground md:flex md:w-72"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search or run a command…</span>
          <span className="kbd">⌘K</span>
        </button>

        <ThemeToggle className="hidden md:inline-flex" />

        <Button
          onClick={onOpenNotifications}
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <Button
          onClick={onOpenAiHub}
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI</span>
        </Button>

        <Button onClick={onOpenInvite} size="sm" className="gap-1.5 shadow-[var(--shadow-soft)]">
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Invite</span>
        </Button>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const projects = useQuery(projectsQuery());
  const parts = pathname.split("/").filter(Boolean);

  function labelize(part: string, index: number) {
    if (part === "app") return "Workspace";
    if (parts[index - 1] === "projects") {
      const project = projects.data?.projects.find((p) => p.slug === part);
      return project?.name ?? part;
    }
    return part.replace(/-/g, " ");
  }

  // Build a stable href for parent crumbs (the segment "projects" alone isn't
  // a real route, so it links to the workspace dashboard).
  function hrefFor(index: number): string | null {
    const segs = parts.slice(0, index + 1);
    if (segs[0] !== "app") return null;
    if (segs.length === 1) return "/app";
    if (segs[1] === "projects") {
      if (segs.length === 2) return "/app";
      const slug = segs[2];
      if (segs.length === 3) return `/app/projects/${slug}`;
      const view = segs[3];
      if (["board", "list", "wiki", "snippets"].includes(view)) {
        return `/app/projects/${slug}/${view}`;
      }
      return `/app/projects/${slug}`;
    }
    return "/" + segs.join("/");
  }

  return (
    <nav className="hidden items-center gap-1.5 text-sm md:flex">
      {parts.map((p, i) => {
        const isLast = i === parts.length - 1;
        const label = labelize(p, i);
        const href = hrefFor(i);
        const clickable = !isLast && href !== null;
        return (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
            {clickable ? (
              <a
                href={href}
                className="truncate capitalize text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </a>
            ) : (
              <span
                className={cn(
                  "truncate capitalize",
                  isLast ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ----------------------- AI Hub -----------------------

function useTypewriter(text: string | null, speed = 18) {
  const [shown, setShown] = React.useState("");
  const idx = React.useRef(0);

  React.useEffect(() => {
    setShown("");
    idx.current = 0;
    if (!text) return;
    const timer = setInterval(() => {
      idx.current += 2;
      if (idx.current >= text.length) {
        setShown(text);
        clearInterval(timer);
      } else {
        setShown(text.slice(0, idx.current));
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  const done = !text || shown.length >= text.length;
  return { shown, done };
}

type AiQuickKind =
  | "architecture"
  | "standup"
  | "refactor"
  | "db"
  | "code-review"
  | "task-breakdown"
  | "blockers";

const QUICK_PROMPTS: {
  id: string;
  kind: AiQuickKind;
  title: string;
  sub: string;
  emoji: string;
}[] = [
  {
    id: "task-breakdown",
    kind: "task-breakdown",
    title: "Break feature into subtasks",
    sub: "Describe a feature → get 4-8 tasks.",
    emoji: "🧩",
  },
  {
    id: "code-review",
    kind: "code-review",
    title: "Review a code snippet",
    sub: "Bugs, perf, security · 1-10 score.",
    emoji: "🛡️",
  },
  {
    id: "blockers",
    kind: "blockers",
    title: "What's blocking us?",
    sub: "Find stale tasks & blockers.",
    emoji: "🚧",
  },
  {
    id: "standup",
    kind: "standup",
    title: "Draft today's standup",
    sub: "From recent activity.",
    emoji: "📋",
  },
  {
    id: "architecture",
    kind: "architecture",
    title: "Explain architecture",
    sub: "How DevCollab is wired up.",
    emoji: "🏗️",
  },
  {
    id: "refactor",
    kind: "refactor",
    title: "Refactor suggestions",
    sub: "Cleaner patterns and code.",
    emoji: "⚡",
  },
];

const PLATFORMS: { id: AiPlatform; title: string; sub: string; tone: string }[] = [
  {
    id: "gemini",
    title: "Gemini 1.5 Pro",
    sub: "Multi-modal logic, backend workflows.",
    tone: "oklch(0.62 0.14 240)",
  },
  {
    id: "claude",
    title: "Claude 3.5 Sonnet",
    sub: "Front-end styling, careful refactors.",
    tone: "oklch(0.78 0.14 80)",
  },
  {
    id: "gpt",
    title: "GPT-4o",
    sub: "Standups, drafts, summaries.",
    tone: "oklch(0.65 0.16 320)",
  },
];

function AiHub({ onClose }: { onClose: () => void }) {
  const [platform, setPlatform] = React.useState<AiPlatform>("gemini");
  const [response, setResponse] = React.useState<AiResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [history, setHistory] = React.useState<{ prompt: string; result: AiResult }[]>([]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function runPrompt(kind: AiQuickKind | "chat", userPrompt?: string) {
    setLoading(true);
    setResponse(null);
    try {
      const promptText =
        userPrompt ??
        ({
          architecture:
            "Explain the DevCollab architecture and how SSR + client routing collaborate.",
          standup: "Draft today's engineering standup from recent activity.",
          refactor: "Suggest a refactor for the board's status reducer pattern.",
          db: "How do I structure Cloudflare D1 migrations and seed data?",
          "code-review":
            prompt ||
            "function add(a,b){\n  if(a==null) return b\n  console.log(a)\n  return a + b\n}",
          "task-breakdown": prompt || "Build a magic-link login system end-to-end.",
          blockers: prompt || "Review my workspace tasks and identify what's blocked.",
          chat: prompt,
        } as Record<AiQuickKind | "chat", string>)[kind];
      const result = await api.ai({ kind, platform, prompt: promptText });
      setResponse(result);
      setHistory((h) => [{ prompt: promptText, result }, ...h].slice(0, 6));
    } catch (err) {
      setResponse({
        output: `Error: ${(err as Error).message}`,
        model: "error",
        provider: "mock",
      });
    } finally {
      setLoading(false);
    }
  }

  const { shown, done } = useTypewriter(response?.output ?? null, 12);

  return (
    <div
      className="fixed inset-0 z-50 flex animate-[var(--animate-fade-in)] items-center justify-center bg-background/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-popover shadow-[var(--shadow-floating)] animate-[var(--animate-scale-in)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-1/3 left-1/2 -z-10 h-[420px] w-[820px] -translate-x-1/2">
          <div className="aurora" />
        </div>

        <div className="flex items-center justify-between border-b border-border bg-background/40 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="absolute inset-0 rounded-lg animate-[var(--animate-pulse-soft)]" />
            </span>
            <div>
              <div className="font-display text-base font-semibold">AI Hub</div>
              <div className="text-[11px] text-muted-foreground">
                Pick a model, ask anything. Results are not saved.
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 min-h-0 md:grid-cols-[260px_1fr]">
          {/* Left panel — model + history */}
          <div className="border-b border-border bg-muted/30 p-4 md:border-b-0 md:border-r">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Model
            </div>
            <div className="mt-2 space-y-1.5">
              {PLATFORMS.map((p) => {
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-lg border p-3 text-left transition-all",
                      active
                        ? "border-primary/40 bg-card shadow-[var(--shadow-soft)]"
                        : "border-border bg-card/50 hover:border-foreground/20 hover:bg-card",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.tone }} />
                      <span className="text-xs font-semibold">{p.title}</span>
                      {active && <Check className="ml-auto h-3 w-3 text-primary" />}
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-snug">{p.sub}</p>
                  </button>
                );
              })}
            </div>

            {history.length > 0 && (
              <>
                <div className="mt-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recent
                </div>
                <div className="mt-2 space-y-1">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setResponse(h.result)}
                      className="block w-full truncate rounded-md px-2 py-1.5 text-left text-[11px] text-muted-foreground hover:bg-card hover:text-foreground"
                    >
                      {h.prompt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right — interaction */}
          <div className="flex min-h-0 flex-col">
            <div className="border-b border-border bg-background/40 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick prompts
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => runPrompt(q.kind)}
                    disabled={loading}
                    className="surface-card pressable group flex items-start gap-2 p-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/[0.03] disabled:opacity-60"
                  >
                    <span className="text-base leading-none">{q.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{q.title}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{q.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative flex-1 min-h-[200px] overflow-y-auto bg-background/40 p-4">
              {loading && !response && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </div>
              )}
              {!loading && !response && (
                <div className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  Pick a quick prompt or ask anything.
                  <div className="mt-1 text-[11px] opacity-70">
                    Try: <span className="kbd">⌘</span>+<span className="kbd">J</span> to toggle
                  </div>
                </div>
              )}
              {response && (
                <div className="space-y-3 animate-[var(--animate-rise-in)]">
                  <div className="flex items-center justify-between">
                    <span className="chip tone-info">
                      {formatAiProvider(response.provider)} •{" "}
                      {response.model}
                    </span>
                    <button
                      onClick={() => runPrompt("chat", prompt || "Try again")}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> Regenerate
                    </button>
                  </div>
                  {response.data ? (
                    <StructuredResult data={response.data} />
                  ) : (
                    <div
                      className={cn(
                        "whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-mono text-[12px] leading-relaxed",
                        !done && "caret",
                      )}
                    >
                      {shown}
                    </div>
                  )}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (prompt.trim().length < 2) return;
                runPrompt("chat", prompt.trim());
              }}
              className="flex items-end gap-2 border-t border-border bg-background/60 p-3 backdrop-blur-sm"
            >
              <div className="relative flex-1">
                <textarea
                  placeholder={`Ask ${PLATFORMS.find((p) => p.id === platform)?.title}…`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (prompt.trim().length >= 2) runPrompt("chat", prompt.trim());
                    }
                  }}
                  className="block w-full resize-none rounded-lg border border-input bg-card px-3 py-2 pr-12 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
                />
                <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
                  ↵
                </span>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={loading || prompt.trim().length < 1}
                className="h-9 gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 *  Structured AI result rendering (Code Review · Task Breakdown · Blockers)
 * ============================================================ */

function StructuredResult({ data }: { data: AiStructured }) {
  if (data.kind === "code-review") {
    const tone =
      data.score >= 8
        ? "oklch(0.62 0.16 155)"
        : data.score >= 5
          ? "oklch(0.74 0.14 80)"
          : "oklch(0.6 0.22 27)";
    return (
      <div className="space-y-3">
        <div className="surface-card flex items-center gap-4 p-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white"
            style={{ background: tone }}
          >
            {data.score}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Quality score · 1-10
            </div>
            <div className="font-display text-sm font-medium">{data.summary}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {data.issues.length} finding{data.issues.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>
        {data.issues.length > 0 && (
          <ul className="surface-card divide-y divide-border/60 p-0">
            {data.issues.map((iss, i) => {
              const sevTone =
                iss.severity === "error"
                  ? "tone-error"
                  : iss.severity === "warn"
                    ? "tone-warning"
                    : "tone-info";
              return (
                <li key={i} className="flex gap-3 p-3 text-sm">
                  <span className={cn("chip uppercase tracking-wide", sevTone)}>
                    {iss.severity}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-semibold capitalize">{iss.category}</span>
                      {iss.line !== undefined && <span>· line {iss.line}</span>}
                    </div>
                    <div className="mt-0.5 text-foreground">{iss.message}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  if (data.kind === "task-breakdown") {
    return <TaskBreakdownResult subtasks={data.subtasks} />;
  }

  if (data.kind === "blockers") {
    return (
      <ul className="surface-card divide-y divide-border/60 p-0">
        {data.blocked.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">
            No blocked tasks detected — nice momentum.
          </li>
        ) : (
          data.blocked.map((b, i) => (
            <li key={i} className="flex gap-3 p-3 text-sm">
              <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-destructive" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{b.title}</div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{b.reason}</div>
                {b.daysStuck !== undefined && (
                  <div className="mt-1 text-[11px] text-destructive">
                    {b.daysStuck} day{b.daysStuck === 1 ? "" : "s"} stuck
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    );
  }

  return null;
}

function TaskBreakdownResult({ subtasks }: { subtasks: AiSubtask[] }) {
  const projects = useQuery(projectsQuery());
  const queryClient = useQueryClient();
  const first = projects.data?.projects[0];
  const [busy, setBusy] = React.useState(false);
  const [created, setCreated] = React.useState(false);

  async function createAll() {
    if (!first) {
      toast.error("Create a project first to receive the subtasks.");
      return;
    }
    setBusy(true);
    try {
      for (const s of subtasks) {
        if (!s.title.trim()) continue;
        await api.createTask(first.slug, {
          title: s.title,
          description: s.description,
          priority: s.priority,
          labels: s.labels,
        });
      }
      toast.success(`Created ${subtasks.length} subtasks in ${first.name}`);
      queryClient.invalidateQueries({ queryKey: qk.tasks(first.slug) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      setCreated(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create tasks");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="surface-card flex items-center justify-between gap-3 p-3">
        <div className="text-xs">
          <div className="font-semibold">{subtasks.length} suggested subtasks</div>
          <div className="text-muted-foreground">
            Will be created in <span className="font-medium">{first?.name ?? "your project"}</span>
            .
          </div>
        </div>
        <Button
          size="sm"
          onClick={createAll}
          disabled={busy || !first || created}
          className="gap-1.5"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : created ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {created ? "Added" : "Create all"}
        </Button>
      </div>
      <ul className="surface-card divide-y divide-border/60 p-0">
        {subtasks.map((s, i) => (
          <li key={i} className="flex gap-3 p-3 text-sm">
            <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{s.title}</span>
                <span className="chip text-[10px] capitalize">{s.priority}</span>
                {s.estimate && (
                  <span className="text-[11px] text-muted-foreground">· {s.estimate}</span>
                )}
              </div>
              {s.description && (
                <div className="mt-0.5 text-[12px] text-muted-foreground">{s.description}</div>
              )}
              {s.labels && s.labels.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.labels.map((l) => (
                    <span
                      key={l.name}
                      className="chip text-[10px]"
                      style={{
                        borderColor: "color-mix(in oklch, var(--muted-foreground) 30%, transparent)",
                      }}
                    >
                      {l.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
