import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { mockProjects, mockActivity, mockTasks, priorityMeta, statusMeta } from "@/lib/mock-data";
import { Pill, Avatar } from "@/components/app/StatusBadge";
import {
  Plus,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Calendar as CalIcon,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Workspace — DevCollab" }] }),
  component: WorkspaceDashboard,
});

function WorkspaceDashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Acme Engineering"
        title="Workspace"
        description="Tuesday, June 11 · Good morning, Mira"
        actions={
          <>
            <Button variant="outline" size="sm">
              Import
            </Button>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Create project
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-[1280px] px-6 py-8 space-y-8">
        <SummaryCards />
        <ProjectsGrid />
        <div className="grid gap-6 lg:grid-cols-3">
          <RecentActivity />
          <MyTasks />
        </div>
      </div>
    </>
  );
}

function SummaryCards() {
  const cards = [
    {
      label: "Active projects",
      value: 4,
      hint: "+1 this week",
      icon: TrendingUp,
      tone: "oklch(0.58 0.15 155)",
    },
    {
      label: "Open tasks",
      value: 42,
      hint: "8 high priority",
      icon: CheckCircle2,
      tone: "oklch(0.62 0.14 240)",
    },
    {
      label: "Overdue",
      value: 3,
      hint: "across 2 projects",
      icon: AlertTriangle,
      tone: "oklch(0.6 0.22 27)",
    },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c, i) => (
        <div key={i} className="surface-card surface-card-hover relative overflow-hidden p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-display text-3xl font-semibold tracking-tight">
                {c.value}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
            </div>
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in oklab, ${c.tone} 12%, transparent)`,
                color: c.tone,
              }}
            >
              <c.icon className="h-4 w-4" />
            </span>
          </div>
          <Sparkline color={c.tone} />
        </div>
      ))}
    </div>
  );
}

function Sparkline({ color }: { color: string }) {
  const pts = [4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9, 11];
  const max = Math.max(...pts);
  const d = pts.map((p, i) => `${(i / (pts.length - 1)) * 100},${100 - (p / max) * 100}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-4 h-10 w-full">
      <polyline points={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function ProjectsGrid() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Pinned and active.</p>
        </div>
        <Link
          to="/app/projects/platform"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View all <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mockProjects.map((p) => (
          <Link
            key={p.id}
            to="/app/projects/$projectId"
            params={{ projectId: p.id }}
            className="surface-card surface-card-hover group p-5"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-6 w-6 rounded" style={{ background: p.color }} />
              <span className="font-display font-semibold">{p.name}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{p.progress}% complete</span>
                <span>{p.openTasks} open</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.progress}%`, background: p.color }}
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(4, p.members) }).map((_, i) => (
                  <Avatar
                    key={i}
                    initials={"AB CD EF GH".split(" ")[i]}
                    color={`oklch(0.65 0.14 ${(i + 1) * 60})`}
                    size={22}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                Open →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentActivity() {
  return (
    <section className="surface-card lg:col-span-2 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold">Recent activity</h2>
          <p className="text-xs text-muted-foreground">Across all projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <CalIcon className="h-3.5 w-3.5" /> Last 7 days
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {mockActivity.map((a, i) => (
          <li key={i} className="flex items-start gap-3 py-3 text-sm">
            <Avatar
              initials={a.who
                .split(" ")
                .map((n) => n[0])
                .join("")}
              color={`oklch(0.65 0.14 ${(i + 1) * 50})`}
              size={28}
            />
            <div className="flex-1">
              <div>
                <span className="font-medium">{a.who}</span>{" "}
                <span className="text-muted-foreground">{a.action}</span>{" "}
                <span className="font-medium">{a.target}</span>
                {a.to ? (
                  <span className="text-muted-foreground">
                    {" "}
                    → <span className="font-medium">{a.to}</span>
                  </span>
                ) : null}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{a.when}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function MyTasks() {
  const mine = mockTasks.slice(0, 5);
  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display font-semibold">My tasks</h2>
          <p className="text-xs text-muted-foreground">Due this week</p>
        </div>
        <Button size="sm" variant="ghost">
          View all
        </Button>
      </div>
      <ul className="space-y-2">
        {mine.map((t) => (
          <li
            key={t.id}
            className="group rounded-md border border-border bg-card p-3 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{t.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{t.id}</span>
                  {t.due && (
                    <>
                      <span>·</span>
                      <span>{t.due}</span>
                    </>
                  )}
                </div>
              </div>
              <Pill color={priorityMeta[t.priority].color}>{priorityMeta[t.priority].label}</Pill>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Pill color={statusMeta[t.status].color}>{statusMeta[t.status].label}</Pill>
              <Avatar initials={t.assignee.initials} color={t.assignee.color} size={22} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
