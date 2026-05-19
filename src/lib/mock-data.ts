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
  {
    id: "platform",
    name: "Platform",
    description: "Core API and infrastructure",
    color: "oklch(0.58 0.15 155)",
    progress: 64,
    members: 8,
    openTasks: 12,
  },
  {
    id: "web",
    name: "Web App",
    description: "Next-gen client experience",
    color: "oklch(0.62 0.14 240)",
    progress: 41,
    members: 5,
    openTasks: 19,
  },
  {
    id: "mobile",
    name: "Mobile",
    description: "iOS + Android shells",
    color: "oklch(0.78 0.14 80)",
    progress: 22,
    members: 3,
    openTasks: 7,
  },
  {
    id: "growth",
    name: "Growth",
    description: "Landing, lifecycle, docs",
    color: "oklch(0.6 0.18 27)",
    progress: 78,
    members: 4,
    openTasks: 4,
  },
];

export const mockActivity = [
  {
    who: "Mira Chen",
    action: "moved",
    target: "Add SSO via Google Workspace",
    to: "In review",
    when: "2m ago",
  },
  {
    who: "Ari Patel",
    action: "commented on",
    target: "Refactor task drag-drop reducer",
    when: "11m ago",
  },
  {
    who: "Jules Park",
    action: "created task",
    target: "Audit log export endpoint",
    when: "1h ago",
  },
  { who: "Noa Schultz", action: "merged PR for", target: "Snippets search", when: "3h ago" },
  { who: "Sam Olu", action: "updated wiki", target: "Onboarding runbook", when: "5h ago" },
  {
    who: "Mira Chen",
    action: "closed",
    target: "Fix race condition in presence",
    when: "yesterday",
  },
];

export const statusMeta: Record<Status, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "oklch(0.7 0.01 160)" },
  todo: { label: "To do", color: "oklch(0.62 0.14 240)" },
  in_progress: { label: "In progress", color: "oklch(0.78 0.14 80)" },
  review: { label: "In review", color: "oklch(0.65 0.1 290)" },
  done: { label: "Done", color: "oklch(0.58 0.15 155)" },
};

export const priorityMeta: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "oklch(0.7 0.01 160)" },
  medium: { label: "Medium", color: "oklch(0.62 0.14 240)" },
  high: { label: "High", color: "oklch(0.78 0.14 80)" },
  urgent: { label: "Urgent", color: "oklch(0.6 0.22 27)" },
};

export interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  lastUpdated: string;
  author: string;
  category: string;
}

export interface Snippet {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  author: string;
  lastUpdated: string;
}

export const mockWikiPages: WikiPage[] = [
  {
    id: "W-101",
    title: "Getting Started Guide",
    slug: "getting-started",
    category: "General",
    author: "Mira Chen",
    lastUpdated: "2 hours ago",
    content: `# Getting Started Guide\n\nWelcome to the Acme Engineering codebase! This document outlines everything you need to know to get up and running locally.\n\n## Tech Stack\nOur application uses a modern, high-performance tech stack built for velocity:\n- **Core Framework**: React 19 + TanStack Start (SSR)\n- **Routing**: TanStack Router (Fully type-safe)\n- **Styling**: Tailwind CSS v4\n- **Database**: Cloudflare D1 SQLite Database\n\n## Local Installation\nEnsure you have Bun or Node v20+ installed. Then run the following:\n\n\`\`\`bash\nbun install\nbun run dev\n\`\`\`\n\nOpen [http://localhost:8080](http://localhost:8080) to inspect the workspace.\n\n## Coding Guidelines\n- Always ensure components are highly performant and use semantic HTML.\n- Keep styling fully responsive. Prefer mobile-first classes.`,
  },
  {
    id: "W-102",
    title: "API Reference Docs",
    slug: "api-reference",
    category: "Developer",
    author: "Ari Patel",
    lastUpdated: "1 day ago",
    content: `# API Reference Docs\n\nThis reference contains endpoint descriptions, payloads, and request guidelines for our internal gateway.\n\n## Authentication\nAll gateway requests must carry a Bearer JWT Token in the Authorization header:\n\n\`\`\`http\nAuthorization: Bearer <your_jwt_token>\n\`\`\`\n\n## Active Endpoints\n\n### 1. GET /api/v1/projects\nLists all active projects in the current workspace workspace.\n\n**Response Code**: \`200 OK\`  \n**Payload**:\n\`\`\`json\n{\n  "projects": [\n    { "id": "platform", "name": "Platform", "progress": 64 }\n  ]\n}\n\`\`\`\n\n### 2. POST /api/v1/tasks/create\nCreates a new task within a specified project.`,
  },
  {
    id: "W-103",
    title: "Architecture & Dataflow",
    slug: "architecture",
    category: "System Design",
    author: "Jules Park",
    lastUpdated: "3 days ago",
    content: `# Architecture & Dataflow\n\nDevCollab relies on a decentralized, distributed event-driven framework to handle collaborative code workspace sessions.\n\n## SSR vs SPA\nWe use **TanStack Start** to server-side render our shell and public landing pages. This delivers exceptionally fast TTFB (Time to First Byte) and optimized SEO.\n\nOnce loaded, the client takes over via **TanStack Router** to enable instantaneous, fluid client-side route transitions without hard refreshes.\n\n## State Management\n- **Server State**: Managed via \`@tanstack/react-query\` for robust caching, refetching, and synchronous server mutations.\n- **Local Component State**: Standard React hooks (\`useState\`, \`useReducer\`, \`useMemo\`).`,
  },
  {
    id: "W-104",
    title: "Database Schema & Migrations",
    slug: "database-schema",
    category: "System Design",
    author: "Noa Schultz",
    lastUpdated: "5 days ago",
    content: `# Database Schema & Migrations\n\nOur database resides in **Cloudflare D1**, a globally distributed serverless SQL database powered by SQLite.\n\n## Core Tables\n\n### Users Table\n\`\`\`sql\nCREATE TABLE users (\n  id TEXT PRIMARY KEY,\n  email TEXT UNIQUE NOT NULL,\n  name TEXT,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\`\`\`\n\n### Tasks Table\n\`\`\`sql\nCREATE TABLE tasks (\n  id TEXT PRIMARY KEY,\n  title TEXT NOT NULL,\n  status TEXT CHECK(status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),\n  assignee_id TEXT REFERENCES users(id)\n);\n\`\`\`\n\n## Running Migrations\nTo apply schema changes locally, run:\n\`\`\`bash\nnpx wrangler d1 migrations apply dev-db --local\n\`\`\``,
  },
];

export const mockSnippets: Snippet[] = [
  {
    id: "S-201",
    title: "SSO Config Scaffold",
    description: "Sets up OAuth2 authentication handlers with Google or Okta.",
    language: "typescript",
    author: "Mira Chen",
    lastUpdated: "1 hour ago",
    code: `import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    email: payload?.email,
    name: payload?.name,
    picture: payload?.picture,
  };
}`,
  },
  {
    id: "S-202",
    title: "useMobile Hook",
    description: "Tailwind responsive drawer detector React hook.",
    language: "typescript",
    author: "Ari Patel",
    lastUpdated: "3 hours ago",
    code: `import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(\`(max-width: \${MOBILE_BREAKPOINT - 1}px)\`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}`,
  },
  {
    id: "S-203",
    title: "Vite Configuration (TanStack Start)",
    description: "Fully responsive build setup for Vite including aliases.",
    language: "typescript",
    author: "Jules Park",
    lastUpdated: "Yesterday",
    code: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackRouter(),
    react(),
    tsconfigPaths(),
  ],
  server: {
    port: 8080,
    strictPort: true,
  },
});`,
  },
  {
    id: "S-204",
    title: "D1 Database Select Query Helper",
    description: "Drizzle-style select query mapping for D1 bindings.",
    language: "typescript",
    author: "Noa Schultz",
    lastUpdated: "4 days ago",
    code: `import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb(env: { DB: D1Database }) {
  return drizzle(env.DB, { schema });
}

export async function fetchActiveTasks(env: { DB: D1Database }) {
  const db = getDb(env);
  return await db.select()
    .from(schema.tasks)
    .where(eq(schema.tasks.status, "in_progress"))
    .execute();
}`,
  },
];
