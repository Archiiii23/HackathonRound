import { queryOptions } from "@tanstack/react-query";
import { api } from "./api";

export const qk = {
  me: ["me"] as const,
  workspaces: ["workspaces"] as const,
  workspaceSummary: ["workspace", "summary"] as const,
  projects: ["projects"] as const,
  project: (idOrSlug: string) => ["project", idOrSlug] as const,
  tasks: (projectIdOrSlug: string) => ["tasks", projectIdOrSlug] as const,
  wiki: (projectIdOrSlug: string) => ["wiki", projectIdOrSlug] as const,
  snippets: (projectIdOrSlug: string) => ["snippets", projectIdOrSlug] as const,
  activity: ["activity"] as const,
  search: (q: string) => ["search", q] as const,
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
