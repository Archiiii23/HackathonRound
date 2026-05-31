import type {
  BillingInfo,
  IntegrationRow,
  ProjectRow,
  PublicUser,
  PublicUserFull,
  WorkspaceSummary,
} from "./api";

export const EMPTY_WORKSPACE_SUMMARY: WorkspaceSummary = {
  activeProjects: 0,
  openTasks: 0,
  overdue: 0,
  memberCount: 0,
  projects: [],
};

export const EMPTY_ME = { user: null as PublicUser | null };
export const EMPTY_PROJECTS = { projects: [] as ProjectRow[] };
export const EMPTY_TASKS = { tasks: [] as import("./api").TaskRow[] };
export const EMPTY_WIKI = { pages: [] as import("./api").WikiPageRow[] };
export const EMPTY_SNIPPETS = { snippets: [] as import("./api").SnippetWithTags[] };
export const EMPTY_ACTIVITY = { events: [] as import("./api").ActivityEvent[] };
export const EMPTY_MEMBERS = { members: [] as import("./api").MemberRow[] };
export const EMPTY_INVITES = { invites: [] as import("./api").InviteRow[] };
export const EMPTY_NOTIFICATIONS = { notifications: [] as import("./api").NotificationRow[], unread: 0 };
export const EMPTY_COMMENTS = { comments: [] as import("./api").CommentRow[] };
export const EMPTY_ATTACHMENTS = { attachments: [] as import("./api").AttachmentRow[] };
export const EMPTY_WIKI_VERSIONS = { versions: [] as import("./api").WikiVersionRow[] };
export const EMPTY_PRESENCE = { users: [] as import("./api").PresenceUser[] };
export const EMPTY_INTEGRATIONS = {
  integrations: [] as IntegrationRow[],
  configured: { github: false, slack: false, notion: false },
};
export const EMPTY_INTEGRATION_LINKS = { links: [] as import("./api").IntegrationLinkRow[] };
export const EMPTY_GITHUB_REPOS = { repos: [] as import("./api").GithubRepo[] };
export const EMPTY_SLACK_CHANNELS = { channels: [] as import("./api").SlackChannel[] };
export const EMPTY_NOTION_PAGES = { pages: [] as import("./api").NotionPage[] };
export const EMPTY_SEARCH = {
  wiki: [] as import("./api").SearchResults["wiki"],
  snippets: [] as import("./api").SearchResults["snippets"],
  tasks: [] as import("./api").SearchResults["tasks"],
};
export const EMPTY_WORKSPACES = {
  workspaces: [] as { id: string; name: string; slug: string; role: string }[],
  activeId: null as string | null,
};
export const EMPTY_ME_FULL = {
  user: {
    id: "",
    email: "",
    name: "Guest",
    avatarColor: "oklch(0.65 0.14 240)",
    avatarUrl: null,
    initials: "??",
    bio: "",
    skills: [],
    githubUrl: "",
  } as PublicUserFull,
};
export const EMPTY_BILLING: BillingInfo = {
  tier: "free",
  tierUpdatedAt: new Date(0),
  usage: { projects: 0, members: 0 },
  limits: { projects: 10, members: 25 },
};

export function fallbackProject(idOrSlug: string): { project: ProjectRow } {
  return {
    project: {
      id: idOrSlug,
      workspaceId: "",
      name: idOrSlug,
      slug: idOrSlug,
      description: "",
      color: "oklch(0.65 0.14 240)",
      createdAt: new Date(),
    },
  };
}
