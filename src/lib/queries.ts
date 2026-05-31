import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";
import {
  EMPTY_ACTIVITY,
  EMPTY_ATTACHMENTS,
  EMPTY_BILLING,
  EMPTY_COMMENTS,
  EMPTY_GITHUB_REPOS,
  EMPTY_INTEGRATION_LINKS,
  EMPTY_INTEGRATIONS,
  EMPTY_INVITES,
  EMPTY_ME,
  EMPTY_ME_FULL,
  EMPTY_MEMBERS,
  EMPTY_NOTION_PAGES,
  EMPTY_NOTIFICATIONS,
  EMPTY_PRESENCE,
  EMPTY_PROJECTS,
  EMPTY_SEARCH,
  EMPTY_SLACK_CHANNELS,
  EMPTY_SNIPPETS,
  EMPTY_TASKS,
  EMPTY_WIKI,
  EMPTY_WIKI_VERSIONS,
  EMPTY_WORKSPACE_SUMMARY,
  EMPTY_WORKSPACES,
  fallbackProject,
} from "./query-fallbacks";
import { safeQueryFn } from "./safe-query";

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

export const meQuery = () =>
  queryOptions({
    queryKey: qk.me,
    queryFn: safeQueryFn(api.me, EMPTY_ME),
    staleTime: 30_000,
    retry: false,
  });

export const workspacesQuery = () =>
  queryOptions({
    queryKey: qk.workspaces,
    queryFn: safeQueryFn(api.workspaces, EMPTY_WORKSPACES),
    retry: false,
  });

export const workspaceSummaryQuery = () =>
  queryOptions({
    queryKey: qk.workspaceSummary,
    queryFn: safeQueryFn(api.workspaceSummary, EMPTY_WORKSPACE_SUMMARY),
    retry: false,
  });

export const projectQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: qk.project(idOrSlug),
    queryFn: safeQueryFn(() => api.project(idOrSlug), fallbackProject(idOrSlug)),
    retry: false,
  });

export const projectsQuery = () =>
  queryOptions({
    queryKey: qk.projects,
    queryFn: safeQueryFn(api.projects, EMPTY_PROJECTS),
    retry: false,
  });

export const tasksQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: qk.tasks(idOrSlug),
    queryFn: safeQueryFn(() => api.tasks(idOrSlug), EMPTY_TASKS),
    retry: false,
  });

export const wikiQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: qk.wiki(idOrSlug),
    queryFn: safeQueryFn(() => api.wiki(idOrSlug), EMPTY_WIKI),
    retry: false,
  });

export const snippetsQuery = (idOrSlug: string) =>
  queryOptions({
    queryKey: qk.snippets(idOrSlug),
    queryFn: safeQueryFn(() => api.snippets(idOrSlug), EMPTY_SNIPPETS),
    retry: false,
  });

export const activityQuery = (limit = 20) =>
  queryOptions({
    queryKey: [...qk.activity, limit],
    queryFn: safeQueryFn(() => api.activity(limit), EMPTY_ACTIVITY),
    retry: false,
  });

export const searchQuery = (q: string) =>
  queryOptions({
    queryKey: qk.search(q),
    queryFn: safeQueryFn(() => api.search(q), EMPTY_SEARCH),
    enabled: q.trim().length > 0,
    staleTime: 5_000,
    retry: false,
  });

export const meFullQuery = () =>
  queryOptions({
    queryKey: qk.meFull,
    queryFn: safeQueryFn(api.meFull, EMPTY_ME_FULL),
    staleTime: 30_000,
    retry: false,
  });

export const membersQuery = () =>
  queryOptions({
    queryKey: qk.members,
    queryFn: safeQueryFn(api.members, EMPTY_MEMBERS),
    retry: false,
  });

export const invitesQuery = () =>
  queryOptions({
    queryKey: qk.invites,
    queryFn: safeQueryFn(api.invites, EMPTY_INVITES),
    retry: false,
  });

export const notificationsQuery = (limit = 25) =>
  queryOptions({
    queryKey: [...qk.notifications, limit],
    queryFn: safeQueryFn(() => api.notifications(limit), EMPTY_NOTIFICATIONS),
    refetchInterval: 30_000,
    retry: false,
  });

export const commentsQuery = (taskId: string) =>
  queryOptions({
    queryKey: qk.comments(taskId),
    queryFn: safeQueryFn(() => api.comments(taskId), EMPTY_COMMENTS),
    enabled: !!taskId,
    retry: false,
  });

export const attachmentsQuery = (taskId: string) =>
  queryOptions({
    queryKey: qk.attachments(taskId),
    queryFn: safeQueryFn(() => api.attachments(taskId), EMPTY_ATTACHMENTS),
    enabled: !!taskId,
    retry: false,
  });

export const wikiVersionsQuery = (pageId: string) =>
  queryOptions({
    queryKey: qk.wikiVersions(pageId),
    queryFn: safeQueryFn(() => api.wikiVersions(pageId), EMPTY_WIKI_VERSIONS),
    enabled: !!pageId,
    retry: false,
  });

export const snippetsTaggedQuery = (projectIdOrSlug: string) =>
  queryOptions({
    queryKey: qk.snippetsTagged(projectIdOrSlug),
    queryFn: safeQueryFn(() => api.snippetsWithTags(projectIdOrSlug), EMPTY_SNIPPETS),
    retry: false,
  });

export const billingQuery = () =>
  queryOptions({
    queryKey: qk.billing,
    queryFn: safeQueryFn(api.billing, EMPTY_BILLING),
    retry: false,
  });

export const presenceQuery = (projectId: string) =>
  queryOptions({
    queryKey: qk.presence(projectId),
    queryFn: safeQueryFn(() => api.presence(projectId), EMPTY_PRESENCE),
    enabled: !!projectId,
    refetchInterval: 10_000,
    retry: false,
  });

export const integrationsQuery = () =>
  queryOptions({
    queryKey: qk.integrations,
    queryFn: safeQueryFn(api.integrations, EMPTY_INTEGRATIONS),
    retry: false,
  });

export const githubReposQuery = () =>
  queryOptions({
    queryKey: qk.githubRepos,
    queryFn: safeQueryFn(api.githubRepos, EMPTY_GITHUB_REPOS),
    retry: false,
    staleTime: 60_000,
  });

export const slackChannelsQuery = () =>
  queryOptions({
    queryKey: qk.slackChannels,
    queryFn: safeQueryFn(api.slackChannels, EMPTY_SLACK_CHANNELS),
    retry: false,
    staleTime: 60_000,
  });

export const notionPagesQuery = (q: string) =>
  queryOptions({
    queryKey: qk.notionPages(q),
    queryFn: safeQueryFn(() => api.notionPages(q), EMPTY_NOTION_PAGES),
    retry: false,
    staleTime: 60_000,
  });

export const projectIntegrationLinksQuery = (projectId: string) =>
  queryOptions({
    queryKey: qk.projectIntegrationLinks(projectId),
    queryFn: safeQueryFn(() => api.projectIntegrationLinks(projectId), EMPTY_INTEGRATION_LINKS),
    enabled: !!projectId,
    retry: false,
  });
