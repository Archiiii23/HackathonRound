import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  integrationsQuery,
  githubReposQuery,
  slackChannelsQuery,
  notionPagesQuery,
  projectsQuery,
  qk,
} from "@/lib/queries";
import {
  api,
  formatRelative,
  type IntegrationKind,
  type IntegrationRow,
  type GithubRepo,
  type NotionPage,
  type SlackChannel,
} from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Github,
  MessageSquare,
  FileText,
  Plug,
  Plus,
  Loader2,
  Link2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/integrations")({
  loader: async ({ context }) => {
    await Promise.all([
      safeEnsureQueryData(context.queryClient, {
        queryKey: qk.integrations,
        queryFn: api.integrations,
        fallback: {
          integrations: [],
          configured: { github: false, slack: false, notion: false },
        },
      }),
      safeEnsureQueryData(context.queryClient, {
        queryKey: qk.projects,
        queryFn: api.projects,
        fallback: { projects: [] },
      }),
    ]);
  },
  component: IntegrationsView,
});

const KIND_META: Record<
  IntegrationKind,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  github: {
    label: "GitHub",
    description: "Sync commits, PRs and issues into the activity feed. Link repos per project.",
    icon: Github,
    color: "oklch(0.4 0.02 270)",
  },
  slack: {
    label: "Slack",
    description: "Send task moves, mentions and updates to your team channels in real time.",
    icon: MessageSquare,
    color: "oklch(0.65 0.18 320)",
  },
  notion: {
    label: "Notion",
    description: "Import existing pages straight into a project's wiki, preserving structure.",
    icon: FileText,
    color: "oklch(0.6 0.02 80)",
  },
};

function IntegrationsView() {
  const { data } = useSuspenseQuery(integrationsQuery());
  const { data: projData } = useSuspenseQuery(projectsQuery());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = React.useState<IntegrationKind | null>(null);

  const byKind: Record<IntegrationKind, IntegrationRow | undefined> = {
    github: data.integrations.find((i) => i.kind === "github"),
    slack: data.integrations.find((i) => i.kind === "slack"),
    notion: data.integrations.find((i) => i.kind === "notion"),
  };

  const disconnect = useMutation({
    mutationFn: (id: string) => api.disconnectIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.integrations });
      toast.success("Disconnected");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't disconnect"),
  });

  function startOAuth(kind: IntegrationKind) {
    const cfg = data.configured[kind];
    if (!cfg) {
      toast.error(
        `${KIND_META[kind].label} OAuth isn't configured on the server. See setup instructions below.`,
      );
      return;
    }
    const url =
      kind === "github"
        ? api.githubStartUrl()
        : kind === "slack"
          ? api.slackStartUrl()
          : api.notionStartUrl();
    window.location.href = url;
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Integrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect external tools to make DevFusion the source of truth for your team.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-1">
        {(Object.keys(KIND_META) as IntegrationKind[]).map((kind) => {
          const meta = KIND_META[kind];
          const row = byKind[kind];
          const Icon = meta.icon;
          const configured = data.configured[kind];
          return (
            <div
              key={kind}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-lg font-semibold">{meta.label}</h2>
                      {row ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : configured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                          <AlertTriangle className="h-3 w-3" /> Server not configured
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                      {meta.description}
                    </p>
                    {row && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {row.accountAvatar && (
                          <img
                            src={row.accountAvatar}
                            alt=""
                            className="h-5 w-5 rounded-full border border-border"
                          />
                        )}
                        <span className="font-medium text-foreground">
                          {row.accountName || row.accountId || "(connected)"}
                        </span>
                        <span>· connected {formatRelative(row.connectedAt)}</span>
                        {row.hasWebhook && (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-primary">
                            <Webhook className="h-3 w-3" /> webhook
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {row ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setOpenModal(kind)} className="gap-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Manage
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Disconnect ${meta.label}?`)) disconnect.mutate(row.id);
                        }}
                        className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Disconnect
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        onClick={() => startOAuth(kind)}
                        disabled={!configured}
                        className="gap-1.5"
                      >
                        <Plug className="h-3.5 w-3.5" /> Connect
                      </Button>
                      {kind === "slack" && (
                        <Button size="sm" variant="outline" onClick={() => setOpenModal("slack")} className="gap-1.5">
                          <Plus className="h-3.5 w-3.5" /> Webhook URL
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup hint card if any kind not configured */}
      {(Object.keys(KIND_META) as IntegrationKind[]).some((k) => !data.configured[k]) && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Some integrations need server-side configuration</p>
              <p className="mt-1 text-xs leading-relaxed">
                Add the corresponding OAuth client IDs / secrets to the backend via{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-foreground">wrangler secret put</code>
                {" "}(or <code className="rounded bg-muted px-1 py-0.5 text-foreground">.dev.vars</code> locally), then
                redeploy. See <code className="rounded bg-muted px-1 py-0.5 text-foreground">INSTALL.md</code> for the
                full list of required keys.
              </p>
            </div>
          </div>
        </div>
      )}

      {openModal === "github" && byKind.github && (
        <GithubManageModal
          integration={byKind.github}
          projects={projData.projects}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "slack" && (
        <SlackManageModal
          connected={!!byKind.slack}
          projects={projData.projects}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "notion" && byKind.notion && (
        <NotionManageModal
          projects={projData.projects}
          onClose={() => {
            setOpenModal(null);
            navigate({ to: "/app" });
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// GitHub modal
// ============================================================

function GithubManageModal({
  integration,
  projects,
  onClose,
}: {
  integration: IntegrationRow;
  projects: Array<{ id: string; name: string; slug: string }>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const repos = useQuery(githubReposQuery());
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [search, setSearch] = React.useState("");
  const [installWebhook, setInstallWebhook] = React.useState(true);

  const filtered: GithubRepo[] = (repos.data?.repos ?? []).filter((r) =>
    search ? r.fullName.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const linkMut = useMutation({
    mutationFn: (repo: GithubRepo) =>
      api.githubLink({
        projectId,
        fullName: repo.fullName,
        url: repo.url,
        installWebhook,
      }),
    onSuccess: (res, repo) => {
      toast.success(
        `Linked ${repo.fullName}` + (res.webhookCreated ? " — webhook installed" : ""),
      );
      queryClient.invalidateQueries({ queryKey: qk.projectIntegrationLinks(projectId) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't link repo"),
  });

  return (
    <ModalShell title={`GitHub · ${integration.accountName}`} onClose={onClose}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium">Project to link</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm focus:border-ring focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={installWebhook}
              onChange={(e) => setInstallWebhook(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Install webhook (commits & PRs into activity feed)
          </label>
        </div>
      </div>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter repos…"
          className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm focus:border-ring focus:outline-none"
        />
      </div>
      <div className="mt-3 max-h-96 overflow-y-auto rounded-lg border border-border">
        {repos.isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading repos…
          </div>
        ) : repos.isError ? (
          <div className="p-4 text-sm text-destructive">
            {repos.error instanceof Error ? repos.error.message : "Couldn't load repos"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No repos match.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{r.fullName}</span>
                    {r.private && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                        private
                      </span>
                    )}
                  </div>
                  {r.description && (
                    <p className="truncate text-[11px] text-muted-foreground">{r.description}</p>
                  )}
                </div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Open repo"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={!projectId || linkMut.isPending}
                  onClick={() => linkMut.mutate(r)}
                >
                  <Link2 className="h-3 w-3" /> Link
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

// ============================================================
// Slack modal — supports OAuth-connected + manual webhook
// ============================================================

function SlackManageModal({
  connected,
  projects,
  onClose,
}: {
  connected: boolean;
  projects: Array<{ id: string; name: string; slug: string }>;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const channels = useQuery({ ...slackChannelsQuery(), enabled: connected });
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [manualUrl, setManualUrl] = React.useState("");

  const linkMut = useMutation({
    mutationFn: (ch: SlackChannel) =>
      api.slackLink({ projectId, channelId: ch.id, channelName: ch.name }),
    onSuccess: (_d, ch) => {
      toast.success(`Linked #${ch.name}`);
      queryClient.invalidateQueries({ queryKey: qk.projectIntegrationLinks(projectId) });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't link channel"),
  });

  const manualMut = useMutation({
    mutationFn: () => api.slackManual({ webhookUrl: manualUrl }),
    onSuccess: () => {
      toast.success("Slack webhook connected");
      queryClient.invalidateQueries({ queryKey: qk.integrations });
      setManualUrl("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't connect"),
  });

  return (
    <ModalShell title="Slack" onClose={onClose}>
      {!connected ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Paste an{" "}
            <a
              href="https://api.slack.com/messaging/webhooks"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              Incoming Webhook URL
            </a>{" "}
            to wire any channel to DevFusion without OAuth.
          </p>
          <input
            type="url"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T000/B000/XXX"
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none"
          />
          <Button
            size="sm"
            disabled={!manualUrl || manualMut.isPending}
            onClick={() => manualMut.mutate()}
            className="gap-1.5"
          >
            <Plug className="h-3.5 w-3.5" /> Connect via webhook
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <label className="text-xs font-medium">Project to link</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm focus:border-ring focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
            {channels.isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading channels…
              </div>
            ) : channels.data?.manual ? (
              <div className="p-4 text-sm text-muted-foreground">
                Connected via manual webhook — messages will be posted to the channel the URL was
                created for. Reconnect via OAuth to pick channels per project.
              </div>
            ) : channels.isError ? (
              <div className="p-4 text-sm text-destructive">
                {channels.error instanceof Error ? channels.error.message : "Couldn't load channels"}
              </div>
            ) : (channels.data?.channels ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No channels.</div>
            ) : (
              <ul className="divide-y divide-border">
                {(channels.data?.channels ?? []).map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                    <span className="flex-1 truncate">
                      <span className="text-muted-foreground">#</span>
                      <span className="font-medium">{c.name}</span>
                      {c.private && (
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          private
                        </span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={!projectId || linkMut.isPending}
                      onClick={() => linkMut.mutate(c)}
                    >
                      <Link2 className="h-3 w-3" /> Link
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ============================================================
// Notion modal
// ============================================================

function NotionManageModal({
  projects,
  onClose,
}: {
  projects: Array<{ id: string; name: string; slug: string }>;
  onClose: () => void;
}) {
  const [projectId, setProjectId] = React.useState(projects[0]?.id ?? "");
  const [search, setSearch] = React.useState("");
  const pages = useQuery(notionPagesQuery(search));

  const importMut = useMutation({
    mutationFn: (page: NotionPage) =>
      api.notionImport({ projectId, pageId: page.id }),
    onSuccess: (res, page) => {
      toast.success(`Imported "${res.title}"`);
      onClose();
      // landing on wiki tab is nicer; we let the parent navigate.
      void page;
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't import"),
  });

  return (
    <ModalShell title="Notion" onClose={onClose}>
      <div className="mb-3">
        <label className="text-xs font-medium">Import into project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm focus:border-ring focus:outline-none"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages…"
          className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-sm focus:border-ring focus:outline-none"
        />
      </div>
      <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
        {pages.isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading pages…
          </div>
        ) : pages.isError ? (
          <div className="p-4 text-sm text-destructive">
            {pages.error instanceof Error ? pages.error.message : "Couldn't load pages"}
          </div>
        ) : (pages.data?.pages ?? []).length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No pages found. Make sure you granted the integration access to the pages you want to
            import.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {(pages.data?.pages ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.title}</div>
                  {p.lastEditedTime && (
                    <div className="text-[11px] text-muted-foreground">
                      edited {formatRelative(p.lastEditedTime)}
                    </div>
                  )}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={!projectId || importMut.isPending}
                  onClick={() => importMut.mutate(p)}
                >
                  {importMut.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  Import
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-display font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
