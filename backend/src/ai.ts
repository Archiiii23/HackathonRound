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
}

export interface AiResponse {
  output: string;
  model: string;
  provider: "openai" | "mock";
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
      return `You are ${persona}, a developer-focused assistant inside DevCollab.`;
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
    default:
      return `${persona}: ${req.prompt}`;
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
  return response;
}
