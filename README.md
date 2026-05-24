# DevCollab 🚀

**DevCollab** is an AI-powered developer workspace designed for high-velocity teams. It combines task management, real-time documentation, code snippets, and proactive AI assistance into a single unified platform.

## ✨ Highlights

- **Dynamic Workspaces**: Project management with robust RBAC roles.
- **Live Kanban**: Real-time task tracking with instant updates.
- **Notion-like Wiki**: Collaborative documentation using TanStack Start SSR.
- **Snippet Vault**: Centralized code snippet management with syntax highlighting.
- **AI Intelligence**: Automated project summaries and AI-driven code reviews.

## 🛠️ Technology Stack

Built with a modern, high-performance edge-ready stack:

- **Frontend**: [TanStack Start](https://tanstack.com/start) (React 19 + SSR)
- **Styling**: Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- **Backend API**: [Hono](https://hono.dev) on Cloudflare Workers
- **Database/ORM**: [Drizzle ORM](https://orm.drizzle.team) + [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)
- **Runtime**: [Bun](https://bun.sh) (Recommended)
- **AI Integration**: OpenAI API

## 🚀 Quick Start

For detailed setup instructions, please refer to [INSTALL.md](../INSTALL.md).

### 1. Prerequisites

Ensure you have Bun or Node.js installed.

### 2. Backend Setup

```bash
cd backend
bun install
bun run db:migrate:local
bun run dev
```

### 3. Frontend Setup

```bash
cd HackathonRound
bun install
bun run dev
```

## 📝 Demo Flow

1. **Sign In**: Access your workspace.
2. **Collaborate**: Use the live Board and Wiki.
3. **AI Assist**: Generate tasks and summaries directly in the dashboard.

## 📜 License

TBD
