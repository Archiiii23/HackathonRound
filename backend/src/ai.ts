import { getDb } from "./db";
import { getEnv } from "./context";
import { aiRuns } from "./schema";
import { prefixedId } from "./ids";

export type AiKind =
  | "summary"
  | "explain"
  | "standup"
  | "refactor"
  | "db"
  | "architecture"
  | "chat";
export type AiPlatform = "gemini" | "claude" | "gpt";

const PLATFORM_LABEL: Record<AiPlatform, string> = {
  gemini: "Gemini 1.5 Pro",
  claude: "Claude 3.5 Sonnet",
  gpt: "GPT-4o",
};

const PLATFORM_MODEL: Record<AiPlatform, string> = {
  gemini: "gpt-4o-mini",
  claude: "gpt-4o-mini",
  gpt: "gpt-4o-mini",
};

export interface AiRequest {
  kind: AiKind;
  platform?: AiPlatform;
  prompt: string;
  context?: string;
  workspaceId?: string;
  projectId?: string;
}

export interface ToolCall {
  action: "create_task" | "update_task_status" | "create_wiki";
  params: any;
}

export interface AiResponse {
  output: string;
  model: string;
  provider: "openai" | "mock";
  toolCall?: ToolCall;
  performedAction?: string;
}

function systemPrompt(kind: AiKind, platform: AiPlatform): string {
  const persona = PLATFORM_LABEL[platform];
  switch (kind) {
    case "summary":
      return `You are ${persona} helping summarize a developer wiki page. Respond in concise Markdown with 3-5 bullet points and a one-line conclusion.`;
    case "explain":
      return `You are ${persona}, a senior code reviewer. Explain the provided snippet in plain English. Cover purpose, structure, and one improvement suggestion in bullet points.`;
    case "standup":
      return `You are ${persona}. Draft a brief engineering standup from the given activity. Use bullet points grouped by Yesterday / Today / Blockers.`;
    case "refactor":
      return `You are ${persona}. Suggest a concrete refactor for the provided code. Return a short paragraph plus a fenced TypeScript code block with the improved version.`;
    case "db":
      return `You are ${persona}. Help the developer with Cloudflare D1 / SQLite questions. Provide a short explanation and a runnable example.`;
    case "architecture":
      return `You are ${persona}. Explain the codebase architecture and how SSR + client routing collaborate. Use 3-4 numbered points.`;
    default:
      return `You are ${persona}, a developer-focused assistant inside DevCollab.
If the user asks you to DO something (create, delete, update), and you decide to perform an action, append a JSON block at the very end of your message in this format:
CALL: {"action": "create_task", "params": {"title": "...", "projectId": "..."}}
Available actions: create_task, update_task_status, create_wiki.`;
  }
}

async function callOpenAi(req: AiRequest, platform: AiPlatform): Promise<AiResponse | null> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;
  const model = env.OPENAI_MODEL ?? PLATFORM_MODEL[platform];
  const base = env.AI_BASE_URL ?? "https://api.openai.com/v1";

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt(req.kind, platform) },
      ...(req.context ? [{ role: "user" as const, content: `Context:\n${req.context}` }] : []),
      { role: "user" as const, content: req.prompt },
    ],
    temperature: 0.4,
    max_tokens: 600,
  };

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("OpenAI call failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const output = data.choices?.[0]?.message?.content?.trim();
    if (!output) return null;
    return { output, model, provider: "openai" };
  } catch (err) {
    console.error("OpenAI fetch error", err);
    return null;
  }
}

function deterministicOutput(req: AiRequest, platform: AiPlatform): string {
  const persona = PLATFORM_LABEL[platform];
  switch (req.kind) {
    case "summary": {
      const headings = (req.context ?? req.prompt)
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("#") || l.startsWith("-") || l.startsWith("*"))
        .slice(0, 5)
        .map((l) => l.replace(/^#+\s*|^[-*]\s*/g, ""));
      const bullets = (
        headings.length
          ? headings
          : [
              "Overview of purpose and scope.",
              "Setup steps and prerequisites.",
              "Key APIs and conventions.",
              "Common pitfalls to watch for.",
            ]
      ).map((h) => `- ${h}`);
      return `### AI Summary (${persona})\n\n${bullets.join("\n")}\n\n_Generated locally without an LLM key._`;
    }
    case "explain": {
      const src = req.context ?? req.prompt;
      const lines = src.split("\n").length;
      const imports = src
        .split("\n")
        .filter((l) => l.trim().startsWith("import"))
        .map((l) => l.replace(/[`"';]/g, "").trim())
        .slice(0, 3);
      return [
        `### Code Walkthrough (${persona})`,
        ``,
        `- **Shape**: ${lines}-line module.`,
        imports.length
          ? `- **External APIs**: ${imports.join(", ")}.`
          : `- **Pure**: no external imports.`,
        `- **Behavior**: Encapsulates a reusable workspace helper with minimal side-effects.`,
        `- **Suggestion**: Extract magic numbers into named constants and add a guard for the null path.`,
        ``,
        `_Generated locally without an LLM key._`,
      ].join("\n");
    }
    case "standup": {
      return [
        `### Standup draft — ${persona}`,
        ``,
        `**Yesterday**`,
        `- Closed two PRs on board drag-and-drop and wiki autosave.`,
        ``,
        `**Today**`,
        `- Finish SSO smoke tests and prep release notes for v1.4.`,
        ``,
        `**Blockers**`,
        `- Waiting on Okta sandbox keys.`,
        ``,
        `_Generated locally without an LLM key._`,
      ].join("\n");
    }
    case "refactor": {
      return [
        `### Refactor proposal (${persona})`,
        ``,
        `Extract the state mutation into a pure reducer that is easier to unit test.`,
        ``,
        "```typescript",
        `export function moveTask(tasks: Task[], id: string, nextStatus: Status): Task[] {`,
        `  return tasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t));`,
        `}`,
        "```",
        ``,
        `_Generated locally without an LLM key._`,
      ].join("\n");
    }
    case "db": {
      return [
        `### Cloudflare D1 quick guide (${persona})`,
        ``,
        `D1 is a serverless SQLite database accessible via the \`DB\` binding.`,
        ``,
        "```sql",
        `CREATE TABLE wiki_pages (`,
        `  id TEXT PRIMARY KEY,`,
        `  title TEXT NOT NULL,`,
        `  content TEXT,`,
        `  category TEXT DEFAULT 'General'`,
        `);`,
        "```",
        ``,
        "Apply with: `bun run db:migrate:local`.",
        ``,
        `_Generated locally without an LLM key._`,
      ].join("\n");
    }
    case "architecture": {
      return [
        `### DevCollab architecture (${persona})`,
        ``,
        `1. **Edge SSR** via TanStack Start on Cloudflare Workers.`,
        `2. **D1** holds users, workspaces, projects, tasks, wiki, and snippets.`,
        `3. **Hono** mounted at \`/api/*\` handles all mutations with cookie sessions.`,
        `4. **React Query** caches data on the client and invalidates after mutations.`,
        ``,
        `_Generated locally without an LLM key._`,
      ].join("\n");
    }
    default: {
      const p = req.prompt.toLowerCase();
      if (p.includes("create task") || p.includes("add task")) {
        const title = req.prompt.match(/(?:task|add)\s+["']?([^"']+)["']?/i)?.[1] ?? "New AI Task";
        return `I've created the task "${title}" for you.\n\nCALL: {"action": "create_task", "params": {"title": "${title}"}}`;
      }
      if (p.includes("move task") || p.includes("update task")) {
        const status = p.includes("done") ? "done" : p.includes("progress") ? "in_progress" : "todo";
        return `I'll move that task to ${status}.\n\nCALL: {"action": "update_task_status", "params": {"status": "${status}"}}`;
      }
      if (p.includes("create wiki") || p.includes("add wiki")) {
        const title = req.prompt.match(/(?:wiki|add)\s+["']?([^"']+)["']?/i)?.[1] ?? "New Wiki Page";
        return `I've created the wiki page "${title}".\n\nCALL: {"action": "create_wiki", "params": {"title": "${title}"}}`;
      }
      return `${persona}: ${req.prompt}`;
    }
  }
}

async function executeAiTool(
  call: ToolCall,
  userId: string,
  workspaceId?: string,
  projectId?: string,
): Promise<string> {
  const db = getDb();
  const { projects, tasks, wikiPages } = require("./schema");
  try {
    // Resolve project ID if slug is provided
    let pid = call.params.projectId ?? projectId;
    if (pid && !pid.startsWith("prj_")) {
      const rows = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, pid))
        .limit(1);
      pid = rows[0]?.id;
    }

    if (call.action === "create_task") {
      if (!pid) throw new Error("No project context for task creation");
      const id = prefixedId("tsk");
      await db.insert(tasks).values({
        id,
        projectId: pid,
        title: call.params.title || "Untitled AI Task",
        description: "Created via AI Hub",
        status: call.params.status ?? "todo",
        priority: call.params.priority ?? "medium",
        createdById: userId,
      });
      return `Created task: ${call.params.title}`;
    }
    if (call.action === "update_task_status") {
      // For demo, we'll just pick the most recent task if no ID is given
      let targetId = call.params.taskId;
      if (!targetId && pid) {
        const last = await db
          .select()
          .from(tasks)
          .where(eq(tasks.projectId, pid))
          .orderBy(desc(tasks.createdAt))
          .limit(1);
        targetId = last[0]?.id;
      }
      if (!targetId) throw new Error("Could not find a task to update");
      await db
        .update(tasks)
        .set({ status: call.params.status, updatedAt: new Date() })
        .where(eq(tasks.id, targetId));
      return `Updated task status to ${call.params.status}`;
    }
    if (call.action === "create_wiki") {
      if (!pid) throw new Error("No project context for wiki creation");
      const id = prefixedId("wik");
      const title = call.params.title || "AI Generated Page";
      await db.insert(wikiPages).values({
        id,
        projectId: pid,
        title,
        slug: require("./ids").slugify(title),
        content: call.params.content || "Content coming soon...",
        authorId: userId,
      });
      return `Created wiki page: ${title}`;
    }
    return "Action not recognized";
  } catch (err) {
    console.error("AI Tool Execution Error:", err);
    return `Failed to perform action: ${(err as Error).message}`;
  }
}

export async function runAi(req: AiRequest, userId: string): Promise<AiResponse> {
  const platform = req.platform ?? "gemini";
  const real = await callOpenAi(req, platform);
  const response = real ?? {
    output: deterministicOutput(req, platform),
    model: `${platform}-mock`,
    provider: "mock" as const,
  };
  try {
    await getDb()
      .insert(aiRuns)
      .values({
        id: prefixedId("air"),
        userId,
        kind: req.kind,
        input: req.prompt.slice(0, 4000),
        output: response.output.slice(0, 8000),
        model: response.model,
      });
  } catch (err) {
    console.error("Failed to persist AI run", err);
  }

  // Detect tool calls
  const callMatch = response.output.match(/CALL:\s*(\{.*\})/);
  if (callMatch) {
    try {
      const call = JSON.parse(callMatch[1]) as ToolCall;
      const result = await executeAiTool(call, userId, req.workspaceId, req.projectId);
      response.toolCall = call;
      response.performedAction = result;
      // Clean up the output to be more user-friendly
      response.output = response.output.replace(/CALL:\s*\{.*\}$/, "").trim();
      response.output += `\n\n✅ **Action performed**: ${result}`;
    } catch (e) {
      console.error("Failed to parse/execute AI tool", e);
    }
  }

  return response;
}
