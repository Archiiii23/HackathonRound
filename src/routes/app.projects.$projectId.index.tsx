import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { qk, tasksQuery } from "@/lib/queries";
import { api, PRIORITY_META, STATUS_META, formatRelative, formatAiProvider } from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import {
  Sparkles,
  RefreshCcw,
  MessageSquare,
  Calendar as CalIcon,
  Github,
  GitPullRequest,
  GitMerge,
} from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/")({
  loader: async ({ context, params }) => {
    await safeEnsureQueryData(context.queryClient, {
      queryKey: qk.tasks(params.projectId),
      queryFn: () => api.tasks(params.projectId),
      fallback: { tasks: [] },
    });
  },
  component: Overview,
});

function Overview() {
  const { projectId } = Route.useParams();
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  const tasks = data.tasks;
  const open = tasks.filter((t) => t.status !== "done").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const review = tasks.filter((t) => t.status === "review").length;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 space-y-8">
      <AiSummaryCard projectId={projectId} />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Open" value={open} sub="across all statuses" tone="oklch(0.62 0.14 240)" />
        <Metric
          label="In review"
          value={review}
          sub="awaiting approval"
          tone="oklch(0.78 0.14 80)"
        />
        <Metric label="Shipped" value={done} sub="this sprint" tone="oklch(0.58 0.15 155)" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentTasks />
        <Side />
      </div>
    </div>
  );
}

function AiSummaryCard({ projectId }: { projectId: string }) {
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  const tasks = data.tasks;
  const [summary, setSummary] = React.useState<string | null>(null);
  const [generating, setGenerating] = React.useState(false);
  const [provider, setProvider] = React.useState<string | null>(null);

  async function run() {
    setGenerating(true);
    setSummary(null);
    try {
      const context = tasks
        .map((t) => `- [${t.status}] ${t.title} (${t.priority})`)
        .slice(0, 12)
        .join("\n");
      const res = await api.ai({
        kind: "summary",
        platform: "gemini",
        prompt: `Summarize the current state of project ${projectId} for an engineering standup.`,
        context,
      });
      setSummary(res.output);
      setProvider(res.provider);
    } catch (err) {
      setSummary(`Could not run AI summary: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="relative overflow-hidden surface-card p-6">
      <div
        className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold">AI summary</h3>
              {provider && (
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {formatAiProvider(provider as "openai" | "gemini" | "mock")}
                </span>
              )}
            </div>
            {summary ? (
              <pre className="mt-2 max-w-2xl whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {summary}
              </pre>
            ) : (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Generate a brief snapshot of where this project stands — tasks in flight, what's
                blocked, and what shipped.
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start"
          onClick={run}
          disabled={generating}
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${generating ? "animate-spin" : ""}`} />
          {summary ? "Regenerate" : "Generate"}
        </Button>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: string;
}) {
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
  const { projectId } = Route.useParams();
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  return (
    <div className="surface-card lg:col-span-2 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold">Recent tasks</h3>
        <Link to="/app/projects/$projectId/board" params={{ projectId }}>
          <Button size="sm" variant="ghost">
            View board
          </Button>
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {data.tasks.slice(0, 6).map((t) => (
          <li key={t.id}>
            <Link
              to="/app/projects/$projectId/list"
              params={{ projectId }}
              className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
            >
              <Pill color={STATUS_META[t.status].color}>{STATUS_META[t.status].label}</Pill>
              <span className="flex-1 truncate text-sm font-medium">{t.title}</span>
              <div className="hidden gap-1 md:flex">
                {t.labels.map((l) => (
                  <LabelChip key={l.name} tone={l.tone}>
                    {l.name}
                  </LabelChip>
                ))}
              </div>
              <Pill color={PRIORITY_META[t.priority].color}>{PRIORITY_META[t.priority].label}</Pill>
              {t.assignee && (
                <Avatar initials={t.assignee.initials} color={t.assignee.avatarColor} />
              )}
            </Link>
          </li>
        ))}
        {data.tasks.length === 0 && (
          <li className="py-6 text-center text-xs text-muted-foreground">
            No tasks yet —{" "}
            <Link
              to="/app/projects/$projectId/board"
              params={{ projectId }}
              search={{ new: "1" } as never}
              className="font-medium text-primary hover:underline"
            >
              add the first one
            </Link>
            .
          </li>
        )}
      </ul>
    </div>
  );
}

function Side() {
  const { projectId } = Route.useParams();
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  const upcoming = data.tasks.filter((t) => t.due).slice(0, 4);
  return (
    <div className="space-y-4">
      <GitHubPanel />
      <div className="surface-card p-5">
        <h3 className="font-display font-semibold">Upcoming</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {upcoming.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <CalIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.due}</div>
              </div>
            </li>
          ))}
          {upcoming.length === 0 && (
            <li className="py-3 text-xs text-muted-foreground">No upcoming due dates.</li>
          )}
        </ul>
      </div>
      <div className="surface-card p-5">
        <h3 className="font-display font-semibold">Latest updates</h3>
        <ul className="mt-3 space-y-3 text-sm">
          {data.tasks.slice(0, 3).map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              {t.assignee && (
                <Avatar initials={t.assignee.initials} color={t.assignee.avatarColor} />
              )}
              <div className="min-w-0 flex-1 truncate text-muted-foreground">
                <span className="font-medium text-foreground">
                  {t.assignee?.name ?? "Unassigned"}
                </span>{" "}
                · <span className="font-medium text-foreground">{t.title}</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {formatRelative(t.updatedAt)}
              </span>
            </li>
          ))}
          {data.tasks.length === 0 && (
            <li className="py-3 text-xs text-muted-foreground">Nothing here yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function GitHubPanel() {
  const prs = [
    { title: "feat: SSO login flow", status: "open", time: "2h ago", author: "mira" },
    { title: "fix: presence race condition", status: "merged", time: "5h ago", author: "ari" },
    { title: "chore: update dependencies", status: "merged", time: "1d ago", author: "jules" },
  ];

  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Github className="h-4 w-4" />
        <h3 className="font-display font-semibold">Pull Requests</h3>
      </div>
      <ul className="space-y-3 text-sm">
        {prs.map((pr, i) => (
          <li key={i} className="flex items-start gap-2.5 hover:bg-muted/30 p-1.5 -mx-1.5 rounded-md transition-colors">
            {pr.status === "open" ? (
              <GitPullRequest className="mt-0.5 h-3.5 w-3.5 text-success" />
            ) : (
              <GitMerge className="mt-0.5 h-3.5 w-3.5 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium hover:underline cursor-pointer">{pr.title}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                <span className="font-medium text-foreground">@{pr.author}</span>
                <span>•</span>
                <span>{pr.time}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
