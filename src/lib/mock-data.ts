export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignee: { name: string; initials: string; color: string };
  due?: string;
  comments: number;
  labels: { name: string; tone: "green" | "blue" | "yellow" | "red" | "gray" }[];
  project: string;
}

const people = [
  { name: "Mira Chen", initials: "MC", color: "oklch(0.7 0.15 155)" },
  { name: "Ari Patel", initials: "AP", color: "oklch(0.65 0.14 240)" },
  { name: "Jules Park", initials: "JP", color: "oklch(0.78 0.14 80)" },
  { name: "Noa Schultz", initials: "NS", color: "oklch(0.6 0.18 27)" },
  { name: "Sam Olu", initials: "SO", color: "oklch(0.6 0.1 200)" },
];

const titles = [
  "Add SSO via Google Workspace",
  "Refactor task drag-drop reducer",
  "Fix race condition in presence channel",
  "Spec the AI standup digest payload",
  "Implement keyboard shortcuts for board",
  "Wire snippets search to OpenSearch",
  "Migrate wiki editor to Tiptap v2",
  "Add audit log export endpoint",
  "Reduce TTFB on /app/projects",
  "Design empty state for AI Hub",
  "Release notes for v1.4",
  "Triage inbound bug reports",
];

const labelPool: Task["labels"] = [
  { name: "frontend", tone: "green" },
  { name: "backend", tone: "blue" },
  { name: "infra", tone: "gray" },
  { name: "bug", tone: "red" },
  { name: "design", tone: "yellow" },
];

export const mockTasks: Task[] = titles.map((t, i) => ({
  id: `T-${1000 + i}`,
  title: t,
  status: (["backlog", "todo", "in_progress", "review", "done"] as Status[])[i % 5],
  priority: (["low", "medium", "high", "urgent"] as Priority[])[i % 4],
  assignee: people[i % people.length],
  due: i % 3 === 0 ? `Jun ${10 + (i % 15)}` : undefined,
  comments: (i * 3) % 7,
  labels: [labelPool[i % labelPool.length], labelPool[(i + 2) % labelPool.length]],
  project: "Platform",
}));

export const mockProjects = [
  { id: "platform", name: "Platform", description: "Core API and infrastructure", color: "oklch(0.58 0.15 155)", progress: 64, members: 8, openTasks: 12 },
  { id: "web", name: "Web App", description: "Next-gen client experience", color: "oklch(0.62 0.14 240)", progress: 41, members: 5, openTasks: 19 },
  { id: "mobile", name: "Mobile", description: "iOS + Android shells", color: "oklch(0.78 0.14 80)", progress: 22, members: 3, openTasks: 7 },
  { id: "growth", name: "Growth", description: "Landing, lifecycle, docs", color: "oklch(0.6 0.18 27)", progress: 78, members: 4, openTasks: 4 },
];

export const mockActivity = [
  { who: "Mira Chen", action: "moved", target: "Add SSO via Google Workspace", to: "In review", when: "2m ago" },
  { who: "Ari Patel", action: "commented on", target: "Refactor task drag-drop reducer", when: "11m ago" },
  { who: "Jules Park", action: "created task", target: "Audit log export endpoint", when: "1h ago" },
  { who: "Noa Schultz", action: "merged PR for", target: "Snippets search", when: "3h ago" },
  { who: "Sam Olu", action: "updated wiki", target: "Onboarding runbook", when: "5h ago" },
  { who: "Mira Chen", action: "closed", target: "Fix race condition in presence", when: "yesterday" },
];

export const statusMeta: Record<Status, { label: string; color: string }> = {
  backlog:     { label: "Backlog",    color: "oklch(0.7 0.01 160)" },
  todo:        { label: "To do",      color: "oklch(0.62 0.14 240)" },
  in_progress: { label: "In progress",color: "oklch(0.78 0.14 80)" },
  review:      { label: "In review",  color: "oklch(0.65 0.1 290)" },
  done:        { label: "Done",       color: "oklch(0.58 0.15 155)" },
};

export const priorityMeta: Record<Priority, { label: string; color: string }> = {
  low:    { label: "Low",    color: "oklch(0.7 0.01 160)" },
  medium: { label: "Medium", color: "oklch(0.62 0.14 240)" },
  high:   { label: "High",   color: "oklch(0.78 0.14 80)" },
  urgent: { label: "Urgent", color: "oklch(0.6 0.22 27)" },
};
