import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Pill, Avatar, AvatarStack } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { activityQuery, qk, tasksQuery, workspaceSummaryQuery } from "@/lib/queries";
import { api, PRIORITY_META, STATUS_META, formatRelative } from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Calendar as CalIcon,
  X,
  Sparkles,
  FolderKanban,
  Activity,
  Loader2,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Workspace — DevCollab" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      safeEnsureQueryData(context.queryClient, {
        queryKey: qk.workspaceSummary,
        queryFn: api.workspaceSummary,
        fallback: {
          activeProjects: 0,
          openTasks: 0,
          overdue: 0,
          memberCount: 0,
          projects: [],
        },
      }),
      safeEnsureQueryData(context.queryClient, {
        queryKey: [...qk.activity, 20],
        queryFn: () => api.activity(20),
        fallback: { events: [] },
      }),
    ]);
  },
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  const summary = useSuspenseQuery(workspaceSummaryQuery());
  const [showCreate, setShowCreate] = React.useState(false);
  const user = Route.useRouteContext().user;
  const greeting = useGreeting();

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Activity className="h-3 w-3" /> Workspace
          </span>
        }
        title={
          <span>
            {greeting}, {user?.name?.split(" ")[0] ?? "there"}{" "}
            <span className="ml-1 inline-block animate-[var(--animate-float)]">👋</span>
          </span>
        }
        description="Here's what's moving across your team today."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => location.reload()}>
              Refresh
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Create project
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-[1280px] space-y-8 px-6 py-8">
        <SummaryCards
          activeProjects={summary.data.activeProjects}
          openTasks={summary.data.openTasks}
          overdue={summary.data.overdue}
          memberCount={summary.data.memberCount}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <MomentumChart />
          <StatusDonut />
        </div>

        <ProjectsGrid onCreate={() => setShowCreate(true)} />

        <div className="grid gap-6 lg:grid-cols-3">
          <RecentActivity />
          <MyTasks />
        </div>
      </div>
      {showCreate && <CreateProjectDialog onClose={() => setShowCreate(false)} />}
    </>
  );
}

function useGreeting() {
  const [g, setG] = React.useState("Welcome");
  React.useEffect(() => {
    const h = new Date().getHours();
    setG(
      h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
    );
  }, []);
  return g;
}

function SummaryCards(props: {
  activeProjects: number;
  openTasks: number;
  overdue: number;
  memberCount: number;
}) {
  const cards = [
    {
      label: "Active projects",
      value: props.activeProjects,
      hint: props.activeProjects ? "Across this workspace" : "Create your first project",
      icon: FolderKanban,
      tone: "oklch(0.58 0.15 155)",
      delta: "+1 this week",
    },
    {
      label: "Open tasks",
      value: props.openTasks,
      hint: "Across all projects",
      icon: CheckCircle2,
      tone: "oklch(0.62 0.14 240)",
      delta: "-3 from yesterday",
    },
    {
      label: "Overdue",
      value: props.overdue,
      hint: "Tracked separately",
      icon: AlertTriangle,
      tone: "oklch(0.6 0.22 27)",
      delta: props.overdue > 0 ? "Needs attention" : "All clear",
    },
    {
      label: "Members",
      value: props.memberCount,
      hint: "Across workspace",
      icon: TrendingUp,
      tone: "oklch(0.65 0.16 320)",
      delta: "Active this week",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <div
          key={i}
          className="surface-card surface-card-hover relative overflow-hidden p-5"
          style={{ animationDelay: `${i * 70}ms` }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-40 blur-2xl"
            style={{ background: c.tone }}
          />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className="mt-2 font-display text-3xl font-semibold tracking-tight">
                {c.value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">{c.hint}</div>
            </div>
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg"
              style={{
                background: `color-mix(in oklab, ${c.tone} 14%, transparent)`,
                color: c.tone,
              }}
            >
              <c.icon className="h-4 w-4" />
            </span>
          </div>
          <div className="relative mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Zap className="h-3 w-3" style={{ color: c.tone }} />
            {c.delta}
          </div>
        </div>
      ))}
    </div>
  );
}

function MomentumChart() {
  const events = useQuery(activityQuery(60));

  const data = React.useMemo(() => {
    const days: { day: string; count: number; label: string }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const count = (events.data?.events ?? []).filter(
        (e) => new Date(e.createdAt).toISOString().slice(0, 10) === key,
      ).length;
      days.push({ day: key, label, count });
    }
    return days;
  }, [events.data]);

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <section className="surface-card relative overflow-hidden p-5 lg:col-span-2">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold">Workspace momentum</h3>
          <p className="text-xs text-muted-foreground">Activity events over the last 14 days</p>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl font-semibold">{total}</div>
          <div className="text-[11px] text-muted-foreground">events</div>
        </div>
      </div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="momentumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis hide />
            <RechartsTooltip
              cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--color-muted-foreground)" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-primary)"
              strokeWidth={2}
              fill="url(#momentumFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StatusDonut() {
  const summary = useSuspenseQuery(workspaceSummaryQuery());
  const slug = summary.data.projects[0]?.slug;
  const tasks = useQuery({ ...tasksQuery(slug ?? ""), enabled: !!slug });

  const data = React.useMemo(() => {
    const counts: Record<string, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    (tasks.data?.tasks ?? []).forEach((t) => {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    });
    return (Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((k) => ({
      name: STATUS_META[k].label,
      value: counts[k] ?? 0,
      color: STATUS_META[k].color,
    }));
  }, [tasks.data]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section className="surface-card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display font-semibold">Status mix</h3>
          <p className="text-xs text-muted-foreground">
            {slug ? `Active project: ${summary.data.projects[0].name}` : "No projects yet"}
          </p>
        </div>
      </div>
      {total === 0 ? (
        <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">
          No tasks yet
        </div>
      ) : (
        <div className="relative h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                strokeWidth={0}
              >
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-2xl font-semibold">{total}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">tasks</div>
          </div>
        </div>
      )}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-mono font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectsGrid({ onCreate }: { onCreate: () => void }) {
  const summary = useSuspenseQuery(workspaceSummaryQuery());
  const projects = summary.data.projects;
  if (!projects.length) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project to start tracking tasks, docs, and snippets together."
        action={
          <Button size="sm" className="gap-1.5" onClick={onCreate}>
            <Plus className="h-3.5 w-3.5" /> Create your first project
          </Button>
        }
      />
    );
  }
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">Active across your workspace.</p>
        </div>
        <Link
          to="/app/projects/$projectId"
          params={{ projectId: projects[0].slug }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Open first <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {projects.map((p, i) => (
          <Link
            key={p.id}
            to="/app/projects/$projectId"
            params={{ projectId: p.slug }}
            className="surface-card surface-card-hover pressable group relative overflow-hidden p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
              style={{ background: p.color }}
            />
            <div className="relative">
              <div className="flex items-center gap-2.5">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                  style={{ background: p.color }}
                >
                  {p.name[0]}
                </span>
                <span className="font-display font-semibold">{p.name}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {p.description || "No description yet."}
              </p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{p.progress}% complete</span>
                  <span>{p.openTasks} open</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${p.progress}%`, background: p.color }}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <AvatarStack
                  members={Array.from({ length: Math.min(4, Math.max(1, p.members)) }).map(
                    (_, j) => ({
                      initials: "ABCDEFGH".slice(j, j + 2),
                      color: `oklch(0.65 0.14 ${(j + 1) * 60})`,
                    }),
                  )}
                  size={22}
                />
                <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                  Open →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  task: "Tasks",
  wiki: "Wiki",
  snippet: "Snippets",
  project: "Projects",
};

const RANGE_LABEL = {
  "1d": "Last 24h",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
} as const;

type ActivityRange = keyof typeof RANGE_LABEL;

function RecentActivity() {
  const summary = useSuspenseQuery(workspaceSummaryQuery());
  const events = useQuery(activityQuery(40));
  const projects = summary.data.projects;

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [enabledTypes, setEnabledTypes] = React.useState<Record<string, boolean>>({
    task: true,
    wiki: true,
    snippet: true,
    project: true,
  });
  const [range, setRange] = React.useState<ActivityRange>("7d");

  const all = React.useMemo(() => events.data?.events ?? [], [events.data]);

  const filtered = React.useMemo(() => {
    const now = Date.now();
    const cutoff =
      range === "1d"
        ? now - 86_400_000
        : range === "7d"
          ? now - 7 * 86_400_000
          : range === "30d"
            ? now - 30 * 86_400_000
            : 0;
    return all.filter((a) => {
      if (cutoff && new Date(a.createdAt).getTime() < cutoff) return false;
      const t = a.targetType.toLowerCase();
      if (enabledTypes[t] === false) return false;
      return true;
    });
  }, [all, range, enabledTypes]);

  function hrefFor(a: (typeof all)[number]): string | null {
    const meta = (a.meta ?? null) as { projectSlug?: string; projectId?: string } | null;
    const slug = meta?.projectSlug ?? projects.find((p) => p.id === meta?.projectId)?.slug ?? null;
    if (!slug) return null;
    const t = a.targetType.toLowerCase();
    if (t === "task") return `/app/projects/${slug}/list`;
    if (t === "wiki") return `/app/projects/${slug}/wiki`;
    if (t === "snippet") return `/app/projects/${slug}/snippets`;
    if (t === "project") return `/app/projects/${slug}`;
    return `/app/projects/${slug}`;
  }

  const activeFilterCount =
    Object.values(enabledTypes).filter((v) => !v).length === 0
      ? 0
      : Object.values(enabledTypes).filter((v) => v).length;

  return (
    <section className="surface-card p-5 lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold">Recent activity</h2>
          <p className="text-xs text-muted-foreground">
            Across all projects · showing {filtered.length}
            {filtered.length !== all.length && ` of ${all.length}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setFilterOpen((v) => !v);
                setRangeOpen(false);
              }}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && activeFilterCount < 4 && (
                <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            {filterOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setFilterOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
                  {Object.entries(ACTIVITY_TYPE_LABEL).map(([key, label]) => {
                    const checked = enabledTypes[key] !== false;
                    return (
                      <button
                        key={key}
                        onClick={() => setEnabledTypes((prev) => ({ ...prev, [key]: !checked }))}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input",
                          )}
                        >
                          {checked && <Check className="h-3 w-3" />}
                        </span>
                        <span className="flex-1">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setRangeOpen((v) => !v);
                setFilterOpen(false);
              }}
            >
              <CalIcon className="h-3.5 w-3.5" /> {RANGE_LABEL[range]}
            </Button>
            {rangeOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setRangeOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
                  {(Object.keys(RANGE_LABEL) as ActivityRange[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRange(r);
                        setRangeOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                        range === r && "bg-muted font-medium",
                      )}
                    >
                      {range === r ? (
                        <Check className="h-3 w-3 text-primary" />
                      ) : (
                        <span className="h-3 w-3" />
                      )}
                      {RANGE_LABEL[r]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {events.isLoading ? (
        <div className="space-y-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={all.length === 0 ? "Nothing yet" : "No matches"}
          description={
            all.length === 0
              ? "Once your team starts moving tasks, their activity shows up here."
              : "Try widening the date range or enabling more types."
          }
          className="border-0 bg-transparent"
        />
      ) : (
        <ul className="-mx-2 space-y-0.5">
          {filtered.map((a) => {
            const href = hrefFor(a);
            const inner = (
              <>
                <Avatar initials={a.actor.initials} color={a.actor.avatarColor} size={28} />
                <div className="flex-1">
                  <div className="leading-snug">
                    <span className="font-medium">{a.actor.name}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium">{a.targetLabel}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatRelative(a.createdAt)}
                  </div>
                </div>
                {href && (
                  <span className="opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                )}
              </>
            );
            const baseCls =
              "group flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors";
            return (
              <li key={a.id}>
                {href ? (
                  <a href={href} className={cn(baseCls, "hover:bg-muted/50")}>
                    {inner}
                  </a>
                ) : (
                  <div className={baseCls}>{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function MyTasks() {
  const summary = useSuspenseQuery(workspaceSummaryQuery());
  const firstSlug = summary.data.projects[0]?.slug;
  const tasks = useQuery({ ...tasksQuery(firstSlug ?? ""), enabled: !!firstSlug });
  const mine = (tasks.data?.tasks ?? []).slice(0, 5);

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold">My tasks</h2>
          <p className="text-xs text-muted-foreground">From your first project</p>
        </div>
        {firstSlug && (
          <Link to="/app/projects/$projectId/list" params={{ projectId: firstSlug }}>
            <Button size="sm" variant="ghost">
              View all
            </Button>
          </Link>
        )}
      </div>
      {mine.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
          {firstSlug ? (
            <span>
              No tasks yet —{" "}
              <Link
                to="/app/projects/$projectId/board"
                params={{ projectId: firstSlug }}
                search={{ new: "1" } as never}
                className="font-medium text-primary hover:underline"
              >
                create one from the board
              </Link>
              .
            </span>
          ) : (
            "No projects yet."
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {mine.map((t) =>
            firstSlug ? (
              <li key={t.id}>
                <Link
                  to="/app/projects/$projectId/list"
                  params={{ projectId: firstSlug }}
                  className="group block rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{t.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{t.id.slice(-6)}</span>
                        {t.due && (
                          <>
                            <span>·</span>
                            <span>{t.due}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Pill color={PRIORITY_META[t.priority].color} size="sm">
                      {PRIORITY_META[t.priority].label}
                    </Pill>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <Pill color={STATUS_META[t.status].color} size="sm">
                      {STATUS_META[t.status].label}
                    </Pill>
                    {t.assignee && (
                      <Avatar
                        initials={t.assignee.initials}
                        color={t.assignee.avatarColor}
                        size={22}
                      />
                    )}
                  </div>
                </Link>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </section>
  );
}

function CreateProjectDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("oklch(0.58 0.15 155)");
  const mutation = useMutation({
    mutationFn: () =>
      api.createProject({
        name: name.trim(),
        description: description.trim(),
        color,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      queryClient.invalidateQueries({ queryKey: qk.projects });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      toast.success(`Project "${name}" created`);
      onClose();
    },
    onError: (err) => toast.error((err as Error).message || "Couldn't create project"),
  });

  const colors = [
    "oklch(0.58 0.15 155)",
    "oklch(0.62 0.14 240)",
    "oklch(0.78 0.14 80)",
    "oklch(0.65 0.16 320)",
    "oklch(0.6 0.22 27)",
    "oklch(0.55 0.12 200)",
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md animate-[var(--animate-fade-in)]"
      onClick={onClose}
    >
      <form
        className="relative w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-[var(--shadow-floating)] animate-[var(--animate-scale-in)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length < 2) return;
          mutation.mutate();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: color }}
          >
            {name[0]?.toUpperCase() ?? <Sparkles className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Create a project</h2>
            <p className="text-xs text-muted-foreground">
              Group tasks, docs, and snippets together.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium" htmlFor="project-name">
              Project name
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="API Platform"
              className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="project-desc">
              Description
            </label>
            <textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary"
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Color</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="relative h-7 w-7 rounded-lg ring-offset-2 ring-offset-popover transition-all hover:scale-110"
                  style={{
                    background: c,
                    boxShadow: c === color ? `0 0 0 2px ${c}` : undefined,
                  }}
                  aria-label="Pick color"
                >
                  {c === color && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="absolute inset-0 m-auto h-3.5 w-3.5 text-white"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        {mutation.isError && (
          <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {(mutation.error as Error).message}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || name.trim().length < 2}
            className="gap-1.5"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Create project
          </Button>
        </div>
      </form>
    </div>
  );
}
