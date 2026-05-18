import * as React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FolderKanban, ListTodo, Calendar, BookOpen, Code2,
  Bell, Activity, Sparkles, Settings, CreditCard, Search, Plus, ChevronsLeft,
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
  { to: "/app/projects/$projectId", params: { projectId: "platform" }, label: "Projects", icon: FolderKanban },
  { to: "/app/projects/$projectId/list", params: { projectId: "platform" }, label: "Tasks", icon: ListTodo },
  { to: "/app/projects/$projectId/board", params: { projectId: "platform" }, label: "Board", icon: Calendar },
];

const secondaryNav: NavItem[] = [
  { to: "#", label: "Wiki", icon: BookOpen },
  { to: "#", label: "Snippets", icon: Code2 },
  { to: "#", label: "Notifications", icon: Bell, badge: 3 },
  { to: "#", label: "Activity", icon: Activity },
  { to: "#", label: "AI Hub", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} pathname={pathname} />
      <div
        className="flex min-h-screen flex-col transition-[padding] duration-200 ease-out"
        style={{ paddingLeft: collapsed ? 72 : 260 }}
      >
        <TopBar onToggleSidebar={() => setCollapsed((v) => !v)} />
        <main className="flex-1 animate-[var(--animate-fade-in)]">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, pathname }: { collapsed: boolean; pathname: string }) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out"
      style={{ width: collapsed ? 72 : 260 }}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        {collapsed ? (
          <Link to="/app" className="mx-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-display text-sm font-semibold">D</span>
          </Link>
        ) : (
          <button className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">A</span>
              <span className="font-medium">Acme Engineering</span>
            </span>
            <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg>
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
          {secondaryNav.map((it) => (
            <SidebarItem key={it.label} {...it} collapsed={collapsed} pathname={pathname} />
          ))}
        </SidebarSection>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <SidebarItem to="#" label="Settings" icon={Settings} collapsed={collapsed} pathname={pathname} />
        <SidebarItem to="#" label="Billing" icon={CreditCard} collapsed={collapsed} pathname={pathname} />
        {!collapsed && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-card px-2 py-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">MC</span>
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

function SidebarSection({ collapsed, label, children }: { collapsed: boolean; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      {!collapsed && <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  to, params, label, icon: Icon, collapsed, pathname, exact, badge,
}: {
  to: string; params?: Record<string, string>; label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean; pathname: string; exact?: boolean; badge?: number;
}) {
  // Resolve $param tokens for active matching
  const resolved = params
    ? Object.entries(params).reduce((acc, [k, v]) => acc.replace(`$${k}`, v), to)
    : to;
  const active = to !== "#" && (exact ? pathname === resolved : pathname === resolved || pathname.startsWith(resolved + "/"));
  const base = "group flex h-9 items-center gap-3 rounded-md px-2 text-sm transition-colors";
  const cls = active
    ? `${base} bg-accent text-accent-foreground font-medium`
    : `${base} text-muted-foreground hover:bg-sidebar-accent hover:text-foreground`;
  const content = (
    <>
      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && badge && (
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>
      )}
    </>
  );
  if (to === "#") {
    return <a href="#" className={cls} title={collapsed ? label : undefined}>{content}</a>;
  }
  return (
    <Link to={to as any} params={params as any} className={cls} title={collapsed ? label : undefined}>
      {content}
    </Link>
  );
}

function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
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
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search tasks, wiki, snippets…"
            className="h-9 w-72 rounded-md border border-input bg-card pl-8 pr-16 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" /> AI
        </Button>
        <Button size="sm" className="gap-1.5">
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
