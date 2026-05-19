import * as React from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { mockWikiPages, mockSnippets, mockTasks } from "@/lib/mock-data";
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
  X,
} from "lucide-react";

type NavItem = {
  to: string;
  params?: Record<string, string>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
};

const navItems: NavItem[] = [
  { to: "/app", label: "Workspace", icon: LayoutDashboard, exact: true },
  {
    to: "/app/projects/$projectId",
    params: { projectId: "platform" },
    label: "Projects",
    icon: FolderKanban,
  },
  {
    to: "/app/projects/$projectId/list",
    params: { projectId: "platform" },
    label: "Tasks",
    icon: ListTodo,
  },
  {
    to: "/app/projects/$projectId/board",
    params: { projectId: "platform" },
    label: "Board",
    icon: Calendar,
  },
];

const secondaryNav = (projectId = "platform"): NavItem[] => [
  { to: "/app/projects/$projectId/wiki", params: { projectId }, label: "Wiki", icon: BookOpen },
  {
    to: "/app/projects/$projectId/snippets",
    params: { projectId },
    label: "Snippets",
    icon: Code2,
  },
  { to: "#", label: "Notifications", icon: Bell, badge: 3 },
  { to: "#", label: "Activity", icon: Activity },
  { to: "ai-hub", label: "AI Hub", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [showAiHub, setShowAiHub] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // AI Hub states
  const [activePlatform, setActivePlatform] = React.useState<"gemini" | "claude" | "gpt">("gemini");
  const [aiResponse, setAiResponse] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  function handleRunAiPrompt(type: "architecture" | "standup" | "refactor" | "db") {
    setAiLoading(true);
    setAiResponse("");

    setTimeout(() => {
      setAiLoading(false);
      if (type === "architecture") {
        setAiResponse(
          `🤖 Assistant: ${activePlatform === "gemini" ? "Google Gemini" : activePlatform === "claude" ? "Claude" : "GPT-4"} Analysis\n\n` +
            `DevCollab is powered by TanStack Start on the frontend, which handles server-side rendering (SSR) for exceptional initial load speeds.\n\n` +
            `The client side relies on TanStack Router to supply fully type-safe transitions. Data caching is controlled via React Query.\n\n` +
            `For data storage, we use a Cloudflare D1 local database named 'DB'. The linter has been optimized to fully support strict TypeScript and Prettier rules.`,
        );
      } else if (type === "standup") {
        setAiResponse(
          `🤖 Assistant Standup Draft:\n\n` +
            `- **Yesterday**: Cleaned ESLint syntax and resolved all 6,000+ CRLF formatting warnings. Added flex columns to responsive page headers.\n` +
            `- **Today**: Enabled workable Wiki and Code Snippet templates with active search queries, copy copy triggers, and AI summaries.\n` +
            `- **Blockers**: None. Ready to proceed with testing the updated workspace D1 bindings.`,
        );
      } else if (type === "refactor") {
        setAiResponse(
          `🤖 Assistant Refactoring Scaffold:\n\n` +
            `Here is an optimized pattern for updating collaborative state updates cleanly:\n\n` +
            `\`\`\`typescript\n` +
            `export function updateTaskState(tasks: Task[], id: string, nextStatus: Status): Task[] {\n` +
            `  return tasks.map(t => \n` +
            `    t.id === id ? { ...t, status: nextStatus, due: "Just updated" } : t\n` +
            `  );\n` +
            `}\n` +
            `\`\`\``,
        );
      } else {
        setAiResponse(
          `🤖 Assistant Cloudflare D1 Guide:\n\n` +
            `Ensure D1 is correctly enabled in wrangler.jsonc. Here is your local SQL schema:\n\n` +
            `\`\`\`sql\n` +
            `CREATE TABLE wiki_pages (\n` +
            `  id TEXT PRIMARY KEY,\n` +
            `  title TEXT NOT NULL,\n` +
            `  content TEXT,\n` +
            `  category TEXT DEFAULT 'General'\n` +
            `);\n` +
            `\`\`\``,
        );
      }
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        pathname={pathname}
        onOpenAiHub={() => {
          setShowAiHub(true);
          setAiResponse("");
        }}
      />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: collapsed ? 72 : 260 }}
      >
        <TopBar
          onToggleSidebar={() => setCollapsed((v) => !v)}
          onOpenAiHub={() => {
            setShowAiHub(true);
            setAiResponse("");
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showResults={showSearchResults}
          setShowResults={setShowSearchResults}
        />
        <main className="flex-1 animate-[var(--animate-fade-in)]">{children}</main>
      </div>

      {/* AI Helper Hub Modal */}
      {showAiHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-[var(--animate-fade-in)]">
          <div className="relative w-full max-w-2xl rounded-xl border border-border bg-popover shadow-[var(--shadow-elevated)] p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                <h3 className="font-display text-lg font-bold">DevCollab AI Assistant Hub</h3>
              </div>
              <button
                onClick={() => {
                  setShowAiHub(false);
                  setAiResponse("");
                }}
                className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3 flex-1 overflow-y-auto pr-1">
              {/* Left Column: AI Platforms */}
              <div className="md:col-span-1 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  Select AI Assistant
                </div>

                <button
                  onClick={() => {
                    setActivePlatform("gemini");
                    setAiResponse("");
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    activePlatform === "gemini"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border hover:border-foreground/20 bg-card"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    Google Gemini 1.5 Pro
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                    Optimized for deep multi-modal logic and backend workflows.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActivePlatform("claude");
                    setAiResponse("");
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    activePlatform === "claude"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border hover:border-foreground/20 bg-card"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    Claude 3.5 Sonnet
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                    Best for advanced front-end styling, hooks, and clean code refactoring.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActivePlatform("gpt");
                    setAiResponse("");
                  }}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    activePlatform === "gpt"
                      ? "border-primary bg-primary/5 text-primary font-semibold"
                      : "border-border hover:border-foreground/20 bg-card"
                  }`}
                >
                  <div className="font-semibold text-xs flex items-center gap-1.5">
                    OpenAI GPT-4o
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground leading-normal">
                    Ideal for checklist summaries, product drafting, and sprint standups.
                  </p>
                </button>
              </div>

              {/* Right Column: Prompts & Output console */}
              <div className="md:col-span-2 flex flex-col gap-3 min-h-[300px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Contextual Assistance
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleRunAiPrompt("architecture")}
                    className="rounded border border-border p-2.5 text-left text-xs bg-card hover:bg-muted/50 transition-colors"
                  >
                    ⚡ <span className="font-medium">Explain Workspace Code</span>
                  </button>
                  <button
                    onClick={() => handleRunAiPrompt("standup")}
                    className="rounded border border-border p-2.5 text-left text-xs bg-card hover:bg-muted/50 transition-colors"
                  >
                    📝 <span className="font-medium">Draft Standup Digest</span>
                  </button>
                  <button
                    onClick={() => handleRunAiPrompt("refactor")}
                    className="rounded border border-border p-2.5 text-left text-xs bg-card hover:bg-muted/50 transition-colors"
                  >
                    🐛 <span className="font-medium">Optimize Reducer State</span>
                  </button>
                  <button
                    onClick={() => handleRunAiPrompt("db")}
                    className="rounded border border-border p-2.5 text-left text-xs bg-card hover:bg-muted/50 transition-colors"
                  >
                    🏗️ <span className="font-medium">Setup D1 Migrations</span>
                  </button>
                </div>

                {/* Console Output */}
                <div className="flex-1 rounded-lg border border-border bg-black/90 p-4 font-mono text-[11px] leading-relaxed text-foreground select-text overflow-y-auto max-h-[220px]">
                  {aiLoading ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4 animate-spin" />
                      <span>
                        Streaming response from{" "}
                        {activePlatform === "gemini"
                          ? "Gemini"
                          : activePlatform === "claude"
                            ? "Claude"
                            : "GPT-4"}
                        ...
                      </span>
                    </div>
                  ) : aiResponse ? (
                    <div className="whitespace-pre-wrap">{aiResponse}</div>
                  ) : (
                    <div className="text-muted-foreground italic">
                      Select an assistant platform and click a prompt above to receive context-aware
                      assistance.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  collapsed,
  pathname,
  onOpenAiHub,
}: {
  collapsed: boolean;
  pathname: string;
  onOpenAiHub: () => void;
}) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out"
      style={{ width: collapsed ? 72 : 260 }}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        {collapsed ? (
          <Link
            to="/app"
            className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <span className="font-display text-sm font-semibold">D</span>
          </Link>
        ) : (
          <button className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                A
              </span>
              <span className="font-medium">Acme Engineering</span>
            </span>
            <svg
              className="h-4 w-4 text-muted-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m7 15 5 5 5-5M7 9l5-5 5 5" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <SidebarSection collapsed={collapsed} label="Workspace">
          {navItems.map((it) => (
            <SidebarItem key={it.to} {...it} collapsed={collapsed} pathname={pathname} />
          ))}
        </SidebarSection>
        <SidebarSection collapsed={collapsed} label="Explore">
          {secondaryNav("platform").map((it) => (
            <SidebarItem
              key={it.label}
              {...it}
              collapsed={collapsed}
              pathname={pathname}
              onClick={() => {
                if (it.to === "ai-hub") {
                  onOpenAiHub();
                }
              }}
            />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SidebarItem
          to="#"
          label="Settings"
          icon={Settings}
          collapsed={collapsed}
          pathname={pathname}
        />
        <SidebarItem
          to="#"
          label="Billing"
          icon={CreditCard}
          collapsed={collapsed}
          pathname={pathname}
        />
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-card px-2 py-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              MC
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">Mira Chen</div>
              <div className="truncate text-xs text-muted-foreground">mira@acme.dev</div>
            </div>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success">
              <span className="absolute inset-0 animate-[var(--animate-pulse-soft)] rounded-full" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarSection({
  collapsed,
  label,
  children,
}: {
  collapsed: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {!collapsed && (
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
  onClick,
}: {
  to: string;
  params?: Record<string, string>;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  pathname: string;
  exact?: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  // Resolve $param tokens for active matching
  const resolved = params
    ? Object.entries(params).reduce((acc, [k, v]) => acc.replace(`$${k}`, v), to)
    : to;
  const active =
    to !== "#" &&
    to !== "ai-hub" &&
    (exact ? pathname === resolved : pathname === resolved || pathname.startsWith(resolved + "/"));
  const base = "group flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors";
  const cls = active
    ? `${base} bg-accent text-accent-foreground font-semibold`
    : `${base} text-muted-foreground hover:bg-sidebar-accent hover:text-foreground`;
  const content = (
    <>
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary animate-pulse" : ""}`} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          {badge}
        </span>
      )}
    </>
  );

  if (to === "ai-hub") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        className={`${base} w-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground text-left`}
        title={collapsed ? label : undefined}
      >
        {content}
      </button>
    );
  }

  if (to === "#") {
    return (
      <a href="#" className={cls} title={collapsed ? label : undefined}>
        {content}
      </a>
    );
  }
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params={params as any}
      className={cls}
      title={collapsed ? label : undefined}
    >
      {content}
    </Link>
  );
}

function TopBar({
  onToggleSidebar,
  onOpenAiHub,
  searchQuery,
  setSearchQuery,
  showResults,
  setShowResults,
}: {
  onToggleSidebar: () => void;
  onOpenAiHub: () => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  showResults: boolean;
  setShowResults: (v: boolean) => void;
}) {
  const navigate = useNavigate();

  // Dynamic filter lists
  const filteredWiki = mockWikiPages.filter(
    (w) =>
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSnippets = mockSnippets.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTasks = mockTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
      <button
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-2">
        {/* Dynamic Global Search */}
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search tasks, wiki, snippets…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="h-9 w-72 rounded-md border border-input bg-card pl-8 pr-16 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowResults(false);
              }}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>

          {/* Search Dropdown Results */}
          {showResults && searchQuery && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowResults(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-[340px] rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
                <div className="max-h-[360px] overflow-y-auto space-y-3 p-1">
                  {/* Category: Wiki Pages */}
                  {filteredWiki.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Wiki Pages
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {filteredWiki.map((w) => (
                          <button
                            key={w.id}
                            onClick={() => {
                              navigate({
                                to: "/app/projects/$projectId/wiki",
                                params: { projectId: "platform" },
                              });
                              setShowResults(false);
                              setSearchQuery("");
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                          >
                            <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <div className="truncate flex-1">
                              <div className="font-semibold text-foreground text-xs">{w.title}</div>
                              <div className="truncate text-[10px] text-muted-foreground">
                                {w.content.slice(0, 50)}...
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Snippets */}
                  {filteredSnippets.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Code Snippets
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {filteredSnippets.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => {
                              navigate({
                                to: "/app/projects/$projectId/snippets",
                                params: { projectId: "platform" },
                              });
                              setShowResults(false);
                              setSearchQuery("");
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                          >
                            <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <div className="truncate flex-1">
                              <div className="font-semibold text-foreground text-xs">{s.title}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                {s.language} • {s.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category: Tasks */}
                  {filteredTasks.length > 0 && (
                    <div>
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Workspace Tasks
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {filteredTasks.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              navigate({
                                to: "/app/projects/$projectId/list",
                                params: { projectId: "platform" },
                              });
                              setShowResults(false);
                              setSearchQuery("");
                            }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                          >
                            <ListTodo className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <div className="truncate flex-1">
                              <div className="font-semibold text-foreground text-xs">{t.title}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">
                                {t.id} • {t.status}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredWiki.length === 0 &&
                    filteredSnippets.length === 0 &&
                    filteredTasks.length === 0 && (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No results for "{searchQuery}"
                      </div>
                    )}
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          onClick={onOpenAiHub}
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5 font-semibold"
        >
          <Sparkles className="h-4 w-4 text-primary animate-pulse" /> AI
        </Button>

        <Button size="sm" className="gap-1.5 shadow-[var(--shadow-soft)]">
          <Plus className="h-4 w-4" /> Invite
        </Button>
      </div>
    </div>
  );
}

function Breadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const parts = pathname.split("/").filter(Boolean);
  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground md:flex">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-border">/</span>}
          <span className={i === parts.length - 1 ? "font-medium text-foreground" : ""}>
            {p === "app" ? "Workspace" : p.replace(/-/g, " ")}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
}
