import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { mockSnippets, type Snippet } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  FileCode,
  Clock,
  User,
} from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/snippets")({
  component: SnippetsView,
});

function SnippetsView() {
  const [snippets, setSnippets] = React.useState<Snippet[]>(mockSnippets);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("all");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // New Snippet Form state
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newLang, setNewLang] = React.useState("typescript");
  const [newCode, setNewCode] = React.useState("");

  // AI Explain State
  const [explainedId, setExplainedId] = React.useState<string | null>(null);
  const [explanationText, setExplanationText] = React.useState<string | null>(null);
  const [isExplaining, setIsExplaining] = React.useState(false);

  function handleCopy(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleAddSnippet(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    const newSnippet: Snippet = {
      id: `S-${200 + snippets.length + 1}`,
      title: newTitle,
      description: newDesc,
      code: newCode,
      language: newLang,
      author: "Mira Chen",
      lastUpdated: "Just now",
    };

    setSnippets((prev) => [newSnippet, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setNewCode("");
    setShowAddForm(false);
  }

  // Simulated AI Explainer
  function handleExplain(snippet: Snippet) {
    if (explainedId === snippet.id) {
      setExplainedId(null);
      setExplanationText(null);
      return;
    }

    setExplainedId(snippet.id);
    setIsExplaining(true);
    setExplanationText(null);

    setTimeout(() => {
      setIsExplaining(false);

      const linesCount = snippet.code.split("\n").length;
      const primaryImports = snippet.code
        .split("\n")
        .filter((line) => line.startsWith("import"))
        .map((line) => line.replace(/import|from|["';]/g, "").trim())
        .slice(0, 2);

      const points = [
        `💡 **Structural Analysis**: This is a **${linesCount}-line** helper module written in **${snippet.language.toUpperCase()}**.`,
      ];

      if (primaryImports.length > 0) {
        points.push(
          `🔌 **External Integrations**: Imports external modules/hooks: \`${primaryImports.join(", ")}\`.`,
        );
      }

      points.push(
        `🛠️ **Core Purpose**: Designed to encapsulate reusable workspace workflows, optimizing TTFB and enhancing user collaborative velocity.`,
        `📈 **Execution Efficiency**: Runs in linear complexity, ideal for Cloudflare Worker serverless edge compilation.`,
      );

      setExplanationText(
        `### 🧠 AI Code Walkthrough (Claude 3.5 Sonnet)\n\n` +
          points.map((p) => `* ${p}`).join("\n"),
      );
    }, 1200);
  }

  const filteredSnippets = snippets.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      selectedLanguage === "all" || s.language.toLowerCase() === selectedLanguage.toLowerCase();
    return matchesSearch && matchesLang;
  });

  const languages = ["all", "typescript", "javascript", "sql", "bash"];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 border-t border-border">
      {/* Header controls */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search & Tags */}
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  selectedLanguage === lang
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1.5 self-start md:self-auto"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add Snippet"}
        </Button>
      </div>

      {/* Add Snippet Panel */}
      {showAddForm && (
        <form
          onSubmit={handleAddSnippet}
          className="surface-card mb-6 p-5 space-y-4 animate-[var(--animate-scale-in)]"
        >
          <h3 className="font-display text-sm font-semibold">Create New Code Snippet</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. useDebounce hook"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Language</label>
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs focus:border-ring focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Brief description of what this code accomplishes..."
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Code Content *</label>
            <textarea
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Paste your source code here..."
              className="min-h-[150px] w-full rounded-md border border-input bg-card p-3 font-mono text-xs focus:border-ring focus:outline-none"
            />
          </div>

          <Button type="submit" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add to repository
          </Button>
        </form>
      )}

      {/* Code Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <div className="surface-card py-16 text-center">
          <Code2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-xs text-muted-foreground">No code snippets match your filter</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSnippets.map((snip) => {
            const isCopying = copiedId === snip.id;
            const isExplainingThis = explainedId === snip.id;

            return (
              <div
                key={snip.id}
                className="surface-card overflow-hidden flex flex-col border border-border/80 transition-all hover:shadow-[var(--shadow-soft)] hover:border-border"
              >
                {/* Card Header */}
                <div className="border-b border-border/60 bg-muted/20 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground uppercase">
                        {snip.language}
                      </span>
                      <h4 className="font-display text-sm font-semibold tracking-tight">
                        {snip.title}
                      </h4>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{snip.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleExplain(snip)}
                      variant="outline"
                      size="sm"
                      className="gap-1 text-xs border-primary/20 text-primary hover:bg-primary/5 h-8"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Explain Code
                    </Button>

                    <Button
                      onClick={() => handleCopy(snip.code, snip.id)}
                      variant="outline"
                      size="sm"
                      className="gap-1 h-8 text-xs shrink-0"
                    >
                      {isCopying ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500 animate-[var(--animate-scale-in)]" />{" "}
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Card Content & Editor View */}
                <div className="grid lg:grid-cols-12 flex-1">
                  {/* Syntax Highlight Panel */}
                  <div
                    className={`${isExplainingThis ? "lg:col-span-8" : "lg:col-span-12"} overflow-x-auto bg-muted/65 p-4 border-r border-border/50 relative group`}
                  >
                    <pre className="font-mono text-[11px] leading-normal text-foreground select-text">
                      {snip.code.split("\n").map((line, idx) => (
                        <div key={idx} className="flex hover:bg-card/25 rounded px-1">
                          <span className="w-8 shrink-0 select-none text-[9px] text-muted-foreground/60 text-right pr-3 font-semibold">
                            {idx + 1}
                          </span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </pre>
                  </div>

                  {/* AI Explanation Drawer/Panel */}
                  {isExplainingThis && (
                    <div className="lg:col-span-4 p-5 bg-primary/5 flex flex-col gap-4 border-t lg:border-t-0 border-border/60 animate-[var(--animate-scale-in)]">
                      {isExplaining ? (
                        <div className="flex flex-col items-center gap-2 py-8 justify-center my-auto">
                          <Sparkles className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-[11px] text-muted-foreground">
                            Claude structural analysis...
                          </span>
                        </div>
                      ) : (
                        <div className="relative h-full flex flex-col justify-between">
                          <button
                            onClick={() => setExplainedId(null)}
                            className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="prose prose-sm dark:prose-invert font-sans text-xs leading-relaxed text-foreground whitespace-pre-line pr-4">
                            {explanationText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer metadata */}
                <div className="border-t border-border/40 bg-muted/10 px-5 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {snip.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Updated {snip.lastUpdated}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    ID: {snip.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
