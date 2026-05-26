export type Status = "backlog" | "todo" | "in_progress" | "review" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type LabelTone = "green" | "blue" | "yellow" | "red" | "gray";
export type AiKind =
  | "summary"
  | "explain"
  | "standup"
  | "refactor"
  | "db"
  | "architecture"
  | "chat";
export type AiPlatform = "gemini" | "claude" | "gpt";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  initials: string;
}

export interface ProjectRow {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  createdAt: string | number | Date;
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  openTasks: number;
  progress: number;
  members: number;
}

export interface WorkspaceSummary {
  activeProjects: number;
  openTasks: number;
  overdue: number;
  memberCount: number;
  projects: ProjectSummary[];
}

export interface Label {
  name: string;
  tone: LabelTone;
}

export interface TaskRow {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  due: string | null;
  position: number;
  assignee: PublicUser | null;
  labels: Label[];
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
}

export interface WikiPageRow {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  updatedAt: string | number | Date;
  createdAt: string | number | Date;
  author: PublicUser;
}

export interface SnippetRow {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  createdAt: string | number | Date;
  updatedAt: string | number | Date;
  author: PublicUser;
}

export interface ActivityEvent {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  meta: Record<string, unknown> | null;
  createdAt: string | number | Date;
  actor: PublicUser;
}

export interface SearchResults {
  wiki: { id: string; title: string; preview: string; projectId: string }[];
  snippets: {
    id: string;
    title: string;
    description: string;
    language: string;
    projectId: string;
  }[];
  tasks: {
    id: string;
    title: string;
    status: Status;
    projectId: string;
    projectSlug: string;
  }[];
}

export interface AiResult {
  output: string;
  model: string;
  provider: "openai" | "mock";
  toolCall?: { action: string; params: any };
  performedAction?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function apiBase(): string {
  const fromEnv =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_API_URL);
  return (fromEnv as string | undefined)?.replace(/\/+$/, "") ?? "http://localhost:8787";
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  const url = `${apiBase()}${path}`;

  // During SSR we don't have access to the browser cookie jar, so forward the
  // incoming session cookie from the user's request to the backend.
  if (import.meta.env.SSR) {
    try {
      const mod = await import("../lib/ssr-request");
      const incoming = mod.getIncomingRequest();
      if (incoming) {
        const cookie = incoming.headers.get("cookie");
        if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
      }
    } catch {
      // No SSR cookie context — proceed without forwarding.
    }
  }

  const body =
    init.json !== undefined
      ? (headers.set("content-type", "application/json"), JSON.stringify(init.json))
      : init.body;
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
    body,
  });
  const text = await res.text();
  const parsed = text
    ? (JSON.parse(text) as { data?: T; error?: { message: string } })
    : ({} as { data?: T });
  if (!res.ok) {
    throw new ApiError(
      res.status,
      parsed.error?.message ?? `Request failed: ${res.status}`,
      parsed,
    );
  }
  return (parsed.data ?? ({} as T)) as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  bootstrap: () =>
    request<{ seeded: boolean; demo?: { email: string; password: string } }>("/auth/bootstrap", {
      method: "POST",
    }),

  me: () => request<{ user: PublicUser | null }>("/auth/me"),
  signup: (input: { email: string; password: string; name: string }) =>
    request<{ user: PublicUser }>("/auth/signup", { method: "POST", json: input }),
  login: (input: { email: string; password: string }) =>
    request<{ user: PublicUser }>("/auth/login", { method: "POST", json: input }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  workspaces: () =>
    request<{
      workspaces: { id: string; name: string; slug: string; role: string }[];
      activeId: string | null;
    }>("/workspaces"),
  workspaceSummary: () => request<WorkspaceSummary>("/workspace/summary"),

  projects: () => request<{ projects: ProjectRow[] }>("/projects"),
  project: (idOrSlug: string) => request<{ project: ProjectRow }>(`/projects/${idOrSlug}`),
  createProject: (input: { name: string; description?: string; color?: string }) =>
    request<{ project: ProjectRow }>("/projects", { method: "POST", json: input }),

  tasks: (projectIdOrSlug: string) =>
    request<{ tasks: TaskRow[] }>(`/projects/${projectIdOrSlug}/tasks`),
  createTask: (
    projectIdOrSlug: string,
    input: Partial<
      Omit<
        TaskRow,
        "id" | "projectId" | "assignee" | "labels" | "createdAt" | "updatedAt" | "position"
      >
    > & {
      title: string;
      labels?: Label[];
      assigneeId?: string | null;
    },
  ) =>
    request<{ task: TaskRow }>(`/projects/${projectIdOrSlug}/tasks`, {
      method: "POST",
      json: input,
    }),
  updateTask: (
    id: string,
    input: Partial<
      Omit<
        TaskRow,
        "id" | "projectId" | "assignee" | "labels" | "createdAt" | "updatedAt" | "position"
      >
    > & { labels?: Label[]; assigneeId?: string | null },
  ) => request<{ task: TaskRow }>(`/tasks/${id}`, { method: "PATCH", json: input }),
  deleteTask: (id: string) => request<{ ok: boolean }>(`/tasks/${id}`, { method: "DELETE" }),
  bulkUpdateTasks: (input: { ids: string[]; status?: Status; assigneeId?: string | null }) =>
    request<{ ok: boolean; count: number }>("/tasks/bulk", { method: "POST", json: input }),
  bulkDeleteTasks: (ids: string[]) =>
    request<{ ok: boolean; count: number }>("/tasks/bulk-delete", {
      method: "POST",
      json: { ids },
    }),

  wiki: (projectIdOrSlug: string) =>
    request<{ pages: WikiPageRow[] }>(`/projects/${projectIdOrSlug}/wiki`),
  createWiki: (
    projectIdOrSlug: string,
    input: { title: string; content: string; category?: string },
  ) =>
    request<{ id: string }>(`/projects/${projectIdOrSlug}/wiki`, {
      method: "POST",
      json: input,
    }),
  updateWiki: (id: string, input: { title?: string; content?: string; category?: string }) =>
    request<{ ok: boolean }>(`/wiki/${id}`, { method: "PATCH", json: input }),
  deleteWiki: (id: string) => request<{ ok: boolean }>(`/wiki/${id}`, { method: "DELETE" }),

  snippets: (projectIdOrSlug: string) =>
    request<{ snippets: SnippetRow[] }>(`/projects/${projectIdOrSlug}/snippets`),
  createSnippet: (
    projectIdOrSlug: string,
    input: { title: string; description?: string; code: string; language: string },
  ) =>
    request<{ id: string }>(`/projects/${projectIdOrSlug}/snippets`, {
      method: "POST",
      json: input,
    }),
  updateSnippet: (
    id: string,
    input: { title?: string; description?: string; code?: string; language?: string },
  ) => request<{ ok: boolean }>(`/snippets/${id}`, { method: "PATCH", json: input }),
  deleteSnippet: (id: string) => request<{ ok: boolean }>(`/snippets/${id}`, { method: "DELETE" }),

  activity: (limit = 20) => request<{ events: ActivityEvent[] }>(`/activity?limit=${limit}`),

  search: (q: string) => request<SearchResults>(`/search?q=${encodeURIComponent(q)}`),

  ai: (input: {
    kind: AiKind;
    platform?: AiPlatform;
    prompt: string;
    context?: string;
    workspaceId?: string;
    projectId?: string;
  }) => request<AiResult>("/ai/run", { method: "POST", json: input }),
};

export const STATUS_META: Record<Status, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "oklch(0.7 0.01 160)" },
  todo: { label: "To do", color: "oklch(0.62 0.14 240)" },
  in_progress: { label: "In progress", color: "oklch(0.78 0.14 80)" },
  review: { label: "In review", color: "oklch(0.65 0.1 290)" },
  done: { label: "Done", color: "oklch(0.58 0.15 155)" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "oklch(0.7 0.01 160)" },
  medium: { label: "Medium", color: "oklch(0.62 0.14 240)" },
  high: { label: "High", color: "oklch(0.78 0.14 80)" },
  urgent: { label: "Urgent", color: "oklch(0.6 0.22 27)" },
};

export function formatRelative(value: string | number | Date): string {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return date.toLocaleDateString();
}
