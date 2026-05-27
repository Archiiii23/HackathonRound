import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

export const qk = {
  me: ["me"] as const,
  meFull: ["me", "full"] as const,
  workspaces: ["workspaces"] as const,
  workspaceSummary: ["workspace", "summary"] as const,
  members: ["workspace", "members"] as const,
  invites: ["workspace", "invites"] as const,
  projects: ["projects"] as const,
  project: (idOrSlug: string) => ["project", idOrSlug] as const,
  tasks: (projectIdOrSlug: string) => ["tasks", projectIdOrSlug] as const,
  comments: (taskId: string) => ["comments", taskId] as const,
  attachments: (taskId: string) => ["attachments", taskId] as const,
  wiki: (projectIdOrSlug: string) => ["wiki", projectIdOrSlug] as const,
  wikiVersions: (pageId: string) => ["wiki", "versions", pageId] as const,
  snippets: (projectIdOrSlug: string) => ["snippets", projectIdOrSlug] as const,
  snippetsTagged: (projectIdOrSlug: string) => ["snippets", "tagged", projectIdOrSlug] as const,
  activity: ["activity"] as const,
  notifications: ["notifications"] as const,
  billing: ["billing"] as const,
  presence: (projectId: string) => ["presence", projectId] as const,
  search: (q: string) => ["search", q] as const,
  integrations: ["integrations"] as const,
  githubRepos: ["integrations", "github", "repos"] as const,
  slackChannels: ["integrations", "slack", "channels"] as const,
  notionPages: (q: string) => ["integrations", "notion", "pages", q] as const,
  projectIntegrationLinks: (projectId: string) =>
    ["integrations", "links", projectId] as const,
};

export const meQuery = () => queryOptions({ queryKey: qk.me, queryFn: api.me, staleTime: 30_000 });

export const workspacesQuery = () =>
  queryOptions({ queryKey: qk.workspaces, queryFn: api.workspaces });

export const workspaceSummaryQuery = () =>
  queryOptions({ queryKey: qk.workspaceSummary, queryFn: api.workspaceSummary });

export const projectQuery = (idOrSlug: string) =>
  queryOptions({ queryKey: qk.project(idOrSlug), queryFn: () => api.project(idOrSlug) });

export const projectsQuery = () => queryOptions({ queryKey: qk.projects, queryFn: api.projects });

export const tasksQuery = (idOrSlug: string) =>
  queryOptions({ queryKey: qk.tasks(idOrSlug), queryFn: () => api.tasks(idOrSlug) });

export const wikiQuery = (idOrSlug: string) =>
  queryOptions({ queryKey: qk.wiki(idOrSlug), queryFn: () => api.wiki(idOrSlug) });

export const snippetsQuery = (idOrSlug: string) =>
  queryOptions({ queryKey: qk.snippets(idOrSlug), queryFn: () => api.snippets(idOrSlug) });

export const activityQuery = (limit = 20) =>
  queryOptions({ queryKey: [...qk.activity, limit], queryFn: () => api.activity(limit) });

export const searchQuery = (q: string) =>
  queryOptions({
    queryKey: qk.search(q),
    queryFn: () => api.search(q),
    enabled: q.trim().length > 0,
    staleTime: 5_000,
  });

export const meFullQuery = () =>
  queryOptions({ queryKey: qk.meFull, queryFn: api.meFull, staleTime: 30_000 });

export const membersQuery = () =>
  queryOptions({ queryKey: qk.members, queryFn: api.members });

export const invitesQuery = () =>
  queryOptions({ queryKey: qk.invites, queryFn: api.invites });

export const notificationsQuery = (limit = 25) =>
  queryOptions({
    queryKey: [...qk.notifications, limit],
    queryFn: () => api.notifications(limit),
    refetchInterval: 30_000,
  });

export const commentsQuery = (taskId: string) =>
  queryOptions({
    queryKey: qk.comments(taskId),
    queryFn: () => api.comments(taskId),
    enabled: !!taskId,
  });

export const attachmentsQuery = (taskId: string) =>
  queryOptions({
    queryKey: qk.attachments(taskId),
    queryFn: () => api.attachments(taskId),
    enabled: !!taskId,
  });

export const wikiVersionsQuery = (pageId: string) =>
  queryOptions({
    queryKey: qk.wikiVersions(pageId),
    queryFn: () => api.wikiVersions(pageId),
    enabled: !!pageId,
  });

export const snippetsTaggedQuery = (projectIdOrSlug: string) =>
  queryOptions({
    queryKey: qk.snippetsTagged(projectIdOrSlug),
    queryFn: () => api.snippetsWithTags(projectIdOrSlug),
  });

export const billingQuery = () =>
  queryOptions({ queryKey: qk.billing, queryFn: api.billing });

export const presenceQuery = (projectId: string) =>
  queryOptions({
    queryKey: qk.presence(projectId),
    queryFn: () => api.presence(projectId),
    enabled: !!projectId,
    refetchInterval: 10_000,
  });

export const integrationsQuery = () =>
  queryOptions({ queryKey: qk.integrations, queryFn: api.integrations });

export const githubReposQuery = () =>
  queryOptions({
    queryKey: qk.githubRepos,
    queryFn: api.githubRepos,
    retry: false,
    staleTime: 60_000,
  });

export const slackChannelsQuery = () =>
  queryOptions({
    queryKey: qk.slackChannels,
    queryFn: api.slackChannels,
    retry: false,
    staleTime: 60_000,
  });

export const notionPagesQuery = (q: string) =>
  queryOptions({
    queryKey: qk.notionPages(q),
    queryFn: () => api.notionPages(q),
    retry: false,
    staleTime: 60_000,
  });

export const projectIntegrationLinksQuery = (projectId: string) =>
  queryOptions({
    queryKey: qk.projectIntegrationLinks(projectId),
    queryFn: () => api.projectIntegrationLinks(projectId),
    enabled: !!projectId,
  });
