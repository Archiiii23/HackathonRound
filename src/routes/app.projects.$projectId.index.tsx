import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { mockTasks, priorityMeta, statusMeta } from "@/lib/mock-data";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { Sparkles, RefreshCcw, MessageSquare, Calendar as CalIcon } from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/")({
  component: Overview,
});

function Overview() {
  const open = mockTasks.filter(t => t.status !== "done").length;
  const done = mockTasks.filter(t => t.status === "done").length;
  const review = mockTasks.filter(t => t.status === "review").length;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 space-y-8">
      <AiSummaryCard />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Open" value={open} sub="across all statuses" tone="oklch(0.62 0.14 240)" />
        <Metric label="In review" value={review} sub="awaiting approval" tone="oklch(0.78 0.14 80)" />
        <Metric label="Shipped" value={done} sub="this sprint" tone="oklch(0.58 0.15 155)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentTasks />
        <Side />
      </div>
    </div>
  );
}

function AiSummaryCard() {
  return (
    <section className="relative overflow-hidden surface-card p-6">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold">AI summary</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">updated 2m ago</span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed">
              <span className="font-medium">3 PRs</span> are ready for review, with <span className="font-medium">2 blockers</span> on the Okta sandbox. The drag-and-drop refactor is on track for EOD; the audit log endpoint needs a spec review before implementation.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Sources:</span>
              <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono">#standup</span>
              <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono">PR-184</span>
              <span className="rounded border border-border bg-card px-1.5 py-0.5 font-mono">T-1003</span>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 self-start"><RefreshCcw className="h-3.5 w-3.5" /> Regenerate</Button>
      </div>
    </section>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: string }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function RecentTasks() {
  return (
    <div className="surface-card lg:col-span-2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold">Recent tasks</h3>
        <Button size="sm" variant="ghost">View board</Button>
      </div>
      <ul className="divide-y divide-border">
        {mockTasks.slice(0, 6).map(t => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <Pill color={statusMeta[t.status].color}>{statusMeta[t.status].label}</Pill>
            <span className="flex-1 truncate text-sm font-medium">{t.title}</span>
            <div className="hidden gap-1 md:flex">
              {t.labels.map(l => <LabelChip key={l.name} tone={l.tone}>{l.name}</LabelChip>)}
            </div>
            <Pill color={priorityMeta[t.priority].color}>{priorityMeta[t.priority].label}</Pill>
            <Avatar initials={t.assignee.initials} color={t.assignee.color} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Side() {
  const upcoming = mockTasks.filter(t => t.due).slice(0, 4);
  return (
    <div className="space-y-4">
      <div className="surface-card p-5">
        <h3 className="font-display font-semibold">Upcoming</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {upcoming.map(t => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground"><CalIcon className="h-3.5 w-3.5" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.due}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="surface-card p-5">
        <h3 className="font-display font-semibold">Discussion</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {mockTasks.slice(0, 3).map(t => (
            <li key={t.id} className="flex items-center gap-3">
              <Avatar initials={t.assignee.initials} color={t.assignee.color} />
              <div className="min-w-0 flex-1 truncate text-muted-foreground">
                <span className="font-medium text-foreground">{t.assignee.name}</span> commented on <span className="font-medium text-foreground">{t.title}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MessageSquare className="h-3 w-3" />{Math.max(1, t.comments)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
