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
  | "chat"
  | "code-review"
  | "task-breakdown"
  | "blockers";
export type AiPlatform = "gemini" | "claude" | "gpt";
export type Role = "owner" | "admin" | "member" | "viewer";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
  avatarUrl?: string | null;
  initials: string;
}

export interface PublicUserFull extends PublicUser {
  bio: string;
  skills: string[];
  githubUrl: string;
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

export interface AiIssue {
  severity: "info" | "warn" | "error";
  category: "bug" | "performance" | "readability" | "security";
  line?: number;
  message: string;
}

export interface AiSubtask {
  title: string;
  description: string;
  priority: Priority;
  labels?: Label[];
  estimate?: string;
}

export interface AiBlocker {
  taskId?: string;
  title: string;
  reason: string;
  daysStuck?: number;
}

export type AiStructured =
  | { kind: "code-review"; score: number; summary: string; issues: AiIssue[] }
  | { kind: "task-breakdown"; subtasks: AiSubtask[] }
  | { kind: "blockers"; blocked: AiBlocker[] };

export interface AiResult {
  output: string;
  model: string;
  provider: "openai" | "mock";
  data?: AiStructured;
}

export interface CommentRow {
  id: string;
  content: string;
  createdAt: string | number | Date;
  author: PublicUser;
}

export interface NotificationRow {
  id: string;
  kind: "mention" | "assignment" | "status_change" | "invite" | "comment" | string;
  title: string;
  body: string;
  targetType: string;
  targetId: string;
  workspaceId: string | null;
  projectId: string | null;
  readAt: string | number | Date | null;
  createdAt: string | number | Date;
  meta: Record<string, unknown> | null;
  actor: PublicUser | null;
}

export interface MemberRow extends PublicUserFull {
  role: Role;
  joinedAt: string | number | Date;
}

export interface InviteRow {
  id: string;
  email: string;
  role: Role;
  token: string;
  acceptedAt: string | number | Date | null;
  expiresAt: string | number | Date;
  createdAt: string | number | Date;
}

export interface WikiVersionRow {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string | number | Date;
  author: PublicUser;
}

export interface BillingInfo {
  tier: "free" | "pro";
  tierUpdatedAt: string | number | Date;
  usage: { projects: number; members: number };
  limits: { projects: number | null; members: number | null };
}

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  initials: string;
  lastSeen: number;
}

export interface SnippetWithTags extends SnippetRow {
  tags: string[];
}

export interface AttachmentRow {
  id: string;
  url: string;
  name: string;
  size: number;
  mime: string;
  createdAt: string | number | Date;
  uploader: PublicUser;
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
  // Read VITE_API_URL from whichever env object exists. Some bundlers / SSR
  // shims replace `import.meta.env` or `process.env` with non-plain objects
  // (Proxies, getters, etc.), so we defensively coerce and validate that the
  // resulting value is actually a non-empty string before calling .replace().
  let candidate: unknown;
  try {
    if (typeof import.meta !== "undefined" && import.meta && (import.meta as ImportMeta).env) {
      candidate = (import.meta as ImportMeta).env.VITE_API_URL;
    }
  } catch {
    // ignore — import.meta may not be available in all contexts
  }
  if (typeof candidate !== "string" || candidate.length === 0) {
    try {
      if (typeof process !== "undefined" && process && process.env) {
        candidate = process.env.VITE_API_URL;
      }
    } catch {
      // ignore — process may not be available in the browser
    }
  }
  if (typeof candidate !== "string" || candidate.length === 0) {
    // In production (Vercel) the API is served from the same origin at /api.
    // In dev (no VITE_API_URL set) fall back to a local Express server.
    if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
      return "/api";
    }
    return "http://localhost:8787";
  }
  return candidate.replace(/\/+$/, "") || "/api";
}

export const API_BASE = apiBase();

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
  const parsed: { data?: T; error?: { message: string } } = text
    ? (JSON.parse(text) as { data?: T; error?: { message: string } })
    : {};
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
    request<{ page: { id: string } }>(`/projects/${projectIdOrSlug}/wiki`, {
      method: "POST",
      json: input,
    }).then((res) => ({ id: res.page.id })),
  updateWiki: (id: string, input: { title?: string; content?: string; category?: string }) =>
    request<{ ok: boolean }>(`/wiki/${id}`, { method: "PATCH", json: input }),
  deleteWiki: (id: string) => request<{ ok: boolean }>(`/wiki/${id}`, { method: "DELETE" }),

  snippets: (projectIdOrSlug: string) =>
    request<{ snippets: SnippetRow[] }>(`/projects/${projectIdOrSlug}/snippets`),
  createSnippet: (
    projectIdOrSlug: string,
    input: { title: string; description?: string; code: string; language: string },
  ) =>
    request<{ snippet: { id: string } }>(`/projects/${projectIdOrSlug}/snippets`, {
      method: "POST",
      json: input,
    }).then((res) => ({ id: res.snippet.id })),
  updateSnippet: (
    id: string,
    input: { title?: string; description?: string; code?: string; language?: string },
  ) => request<{ ok: boolean }>(`/snippets/${id}`, { method: "PATCH", json: input }),
  deleteSnippet: (id: string) => request<{ ok: boolean }>(`/snippets/${id}`, { method: "DELETE" }),

  activity: (limit = 20) => request<{ events: ActivityEvent[] }>(`/activity?limit=${limit}`),

  search: (q: string) => request<SearchResults>(`/search?q=${encodeURIComponent(q)}`),

  ai: (input: { kind: AiKind; platform?: AiPlatform; prompt: string; context?: string }) =>
    request<AiResult>("/ai", { method: "POST", json: input }),

  // ----- members / invites -----
  members: async () => {
    const res = await request<{
      members: Array<{
        role: Role;
        joinedAt: string | number | Date;
        user: PublicUserFull | null;
      }>;
    }>("/workspace/members");
    return {
      members: res.members
        .filter((m): m is typeof m & { user: PublicUserFull } => !!m.user)
        .map((m) => ({
          ...m.user,
          role: m.role,
          joinedAt: m.joinedAt,
        })),
    };
  },
  updateMemberRole: (userId: string, role: Role) =>
    request<{ ok: boolean }>(`/workspace/members/${userId}`, {
      method: "PATCH",
      json: { role },
    }),
  removeMember: (userId: string) =>
    request<{ ok: boolean }>(`/workspace/members/${userId}`, { method: "DELETE" }),
  invites: () => request<{ invites: InviteRow[] }>("/workspace/invites"),
  createInvite: (input: { email: string; role?: "admin" | "member" | "viewer" }) =>
    request<{ id: string; token: string }>("/workspace/invites", {
      method: "POST",
      json: input,
    }),
  deleteInvite: (id: string) =>
    request<{ ok: boolean }>(`/workspace/invites/${id}`, { method: "DELETE" }),
  acceptInvite: (token: string) =>
    request<{ workspaceId: string; role: Role }>("/invites/accept", {
      method: "POST",
      json: { token },
    }),

  // ----- notifications -----
  notifications: (limit = 25) =>
    request<{ notifications: NotificationRow[]; unread: number }>(
      `/notifications?limit=${limit}`,
    ),
  readNotification: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "POST" }),
  readAllNotifications: () =>
    request<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),

  // ----- profile -----
  meFull: () => request<{ user: PublicUserFull }>("/auth/me/full"),
  updateProfile: (
    input: Partial<{
      name: string;
      bio: string;
      skills: string[];
      githubUrl: string;
      avatarUrl: string | null;
    }>,
  ) => request<{ user: PublicUserFull }>("/auth/profile", { method: "PATCH", json: input }),
  changePassword: (input: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean }>("/auth/password", { method: "POST", json: input }),

  // ----- task comments / attachments -----
  comments: async (taskId: string) => {
    const res = await request<{
      comments: Array<{
        id: string;
        body?: string;
        content?: string;
        createdAt: string | number | Date;
        author: PublicUser | null;
      }>;
    }>(`/tasks/${taskId}/comments`);
    return {
      comments: res.comments
        .filter((c): c is typeof c & { author: PublicUser } => !!c.author)
        .map((c) => ({
          id: c.id,
          content: c.content ?? c.body ?? "",
          createdAt: c.createdAt,
          author: c.author,
        })),
    };
  },
  createComment: (taskId: string, content: string) =>
    request<{ commentId: string }>(`/tasks/${taskId}/comments`, {
      method: "POST",
      json: { body: content, content },
    }).then((res) => {
      const row = res as { commentId?: string; comment?: { id: string } };
      return { commentId: row.commentId ?? row.comment?.id ?? "" };
    }),
  attachments: (taskId: string) =>
    request<{ attachments: AttachmentRow[] }>(`/tasks/${taskId}/attachments`),
  createAttachment: (
    taskId: string,
    input: { url: string; name: string; size?: number; mime?: string },
  ) =>
    request<{ id: string }>(`/tasks/${taskId}/attachments`, {
      method: "POST",
      json: input,
    }),
  deleteAttachment: (taskId: string, attachmentId: string) =>
    request<{ ok: boolean }>(`/tasks/${taskId}/attachments/${attachmentId}`, {
      method: "DELETE",
    }),

  // ----- snippet tags -----
  snippetsWithTags: (projectIdOrSlug: string) =>
    request<{ snippets: SnippetWithTags[] }>(`/projects/${projectIdOrSlug}/snippets`),
  setSnippetTags: (snippetId: string, tags: string[]) =>
    request<{ tags: string[] }>(`/snippets/${snippetId}/tags`, {
      method: "PUT",
      json: { tags },
    }),

  // ----- wiki versions -----
  wikiVersions: (pageId: string) =>
    request<{ versions: WikiVersionRow[] }>(`/wiki/${pageId}/versions`),
  revertWiki: (pageId: string, versionId: string) =>
    request<{ ok: boolean }>(`/wiki/${pageId}/revert/${versionId}`, {
      method: "POST",
    }),

  // ----- billing -----
  billing: () => request<BillingInfo>("/billing"),
  checkout: (
    plan: "pro" | "free",
    card?: { number: string; cvc: string; exp: string },
  ) =>
    request<{ ok?: boolean; tier: "free" | "pro"; sandbox?: boolean; receiptId?: string }>(
      "/billing/checkout",
      { method: "POST", json: { plan, card } },
    ).then((res) => ({
      ok: true,
      tier: res.tier,
      sandbox: res.sandbox ?? true,
      receiptId: res.receiptId ?? `rcpt_${Date.now()}`,
    })),

  // ----- presence -----
  presence: async (projectId: string) => {
    const res = await request<{
      users: Array<{
        id: string;
        name: string;
        initials: string;
        color?: string;
        avatarColor?: string;
        lastSeen: string | number | Date;
      }>;
    }>(`/projects/${projectId}/presence`);
    return {
      users: res.users.map((u) => ({
        id: u.id,
        name: u.name,
        initials: u.initials,
        color: u.color ?? u.avatarColor ?? "oklch(0.65 0.14 240)",
        lastSeen: new Date(u.lastSeen).getTime(),
      })),
    };
  },
  presenceHeartbeat: (projectId: string) =>
    request<{ ok: boolean }>(`/projects/${projectId}/presence`, { method: "POST" }),

  // ----- integrations -----
  integrations: () =>
    request<{
      integrations: IntegrationRow[];
      configured: { github: boolean; slack: boolean; notion: boolean };
    }>("/integrations"),
  disconnectIntegration: (id: string) =>
    request<{ deleted: true }>(`/integrations/${id}`, { method: "DELETE" }),
  projectIntegrationLinks: (projectId: string) =>
    request<{ links: IntegrationLinkRow[] }>(`/integrations/links/${projectId}`),
  deleteIntegrationLink: (id: string) =>
    request<{ deleted: true }>(`/integrations/links/${id}`, { method: "DELETE" }),

  // GitHub
  githubStartUrl: () => `${API_BASE}/integrations/github/start`,
  githubRepos: () => request<{ repos: GithubRepo[] }>("/integrations/github/repos"),
  githubLink: (input: {
    projectId: string;
    fullName: string;
    url: string;
    installWebhook?: boolean;
  }) =>
    request<{ linkId: string; webhookCreated: boolean }>("/integrations/github/link", {
      method: "POST",
      json: input,
    }),

  // Slack
  slackStartUrl: () => `${API_BASE}/integrations/slack/start`,
  slackChannels: () =>
    request<{ channels: SlackChannel[]; manual?: boolean }>("/integrations/slack/channels"),
  slackLink: (input: { projectId: string; channelId: string; channelName?: string }) =>
    request<{ linkId: string }>("/integrations/slack/link", { method: "POST", json: input }),
  slackManual: (input: { webhookUrl: string; name?: string }) =>
    request<{ connected: true }>("/integrations/slack/manual", {
      method: "POST",
      json: input,
    }),

  // Notion
  notionStartUrl: () => `${API_BASE}/integrations/notion/start`,
  notionPages: (q?: string) =>
    request<{ pages: NotionPage[] }>(
      "/integrations/notion/pages" + (q ? `?q=${encodeURIComponent(q)}` : ""),
    ),
  notionImport: (input: { projectId: string; pageId: string }) =>
    request<{ pageId: string; title: string }>("/integrations/notion/import", {
      method: "POST",
      json: input,
    }),
};

// ----- integration types -----
export type IntegrationKind = "github" | "slack" | "notion";
export interface IntegrationRow {
  id: string;
  kind: IntegrationKind;
  accountId: string;
  accountName: string;
  accountAvatar: string;
  scope: string;
  hasWebhook: boolean;
  connectedAt: string | number | Date;
  updatedAt: string | number | Date;
  meta: Record<string, unknown>;
}
export interface IntegrationLinkRow {
  id: string;
  kind: IntegrationKind;
  externalId: string;
  externalName: string;
  externalUrl: string;
  meta: Record<string, unknown>;
  createdAt: string | number | Date;
}
export interface GithubRepo {
  id: number;
  fullName: string;
  name: string;
  private: boolean;
  url: string;
  description: string;
  language: string;
  updatedAt: string;
}
export interface SlackChannel {
  id: string;
  name: string;
  private: boolean;
}
export interface NotionPage {
  id: string;
  title: string;
  url: string;
  lastEditedTime: string;
}

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
