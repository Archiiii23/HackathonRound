import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { qk, snippetsTaggedQuery } from "@/lib/queries";
import { api, formatRelative, type SnippetWithTags } from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { toast } from "sonner";
import {
  Code2,
  Search,
  Plus,
  Copy,
  Check,
  Sparkles,
  X,
  Clock,
  User,
  Trash2,
  Maximize2,
  Minimize2,
  Loader2,
  Share2,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId/snippets")({
  loader: async ({ context, params }) => {
    await safeEnsureQueryData(context.queryClient, {
      queryKey: qk.snippetsTagged(params.projectId),
      queryFn: () => api.snippetsWithTags(params.projectId),
      fallback: { snippets: [] },
    });
  },
  component: SnippetsView,
});

const LANGUAGE_TONES: Record<string, string> = {
  typescript: "oklch(0.62 0.14 240)",
  javascript: "oklch(0.78 0.14 80)",
  python: "oklch(0.58 0.15 155)",
  sql: "oklch(0.65 0.16 320)",
  bash: "oklch(0.55 0.05 200)",
  rust: "oklch(0.6 0.22 27)",
  go: "oklch(0.7 0.14 200)",
};

function langTone(lang: string) {
  return LANGUAGE_TONES[lang.toLowerCase()] ?? "oklch(0.6 0.01 160)";
}

function SnippetsView() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(snippetsTaggedQuery(projectId));
  const snippets = data.snippets;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLanguage, setSelectedLanguage] = React.useState<string>("all");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [newLang, setNewLang] = React.useState("typescript");
  const [newCode, setNewCode] = React.useState("");
  const [newTags, setNewTags] = React.useState("");

  const [explainedId, setExplainedId] = React.useState<string | null>(null);
  const [explanationText, setExplanationText] = React.useState<string | null>(null);
  const [isExplaining, setIsExplaining] = React.useState(false);
  const [explainProvider, setExplainProvider] = React.useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.createSnippet(projectId, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        code: newCode,
        language: newLang,
      });
      const parsedTags = newTags
        .split(/[,\s]+/)
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (parsedTags.length) {
        try {
          await api.setSnippetTags(res.id, parsedTags);
        } catch {
          /* ignore tag errors */
        }
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.snippets(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.snippetsTagged(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      setNewTitle("");
      setNewDesc("");
      setNewCode("");
      setNewTags("");
      setShowAddForm(false);
      toast.success("Snippet added");
    },
    onError: () => toast.error("Couldn't save snippet"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSnippet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.snippets(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.snippetsTagged(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      toast.success("Snippet deleted");
    },
    onError: () => toast.error("Couldn't delete"),
  });

  const setTagsMutation = useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => api.setSnippetTags(id, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.snippetsTagged(projectId) });
      toast.success("Tags updated");
    },
    onError: () => toast.error("Couldn't update tags"),
  });

  function handleCopy(code: string, id: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Copy failed"));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleShare(snippet: SnippetWithTags) {
    const url = `${window.location.origin}/app/projects/${projectId}/snippets#${snippet.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Share link copied"))
      .catch(() => toast.error("Couldn't copy link"));
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function handleExplain(snippet: SnippetWithTags) {
    if (explainedId === snippet.id) {
      setExplainedId(null);
      setExplanationText(null);
      setExplainProvider(null);
      return;
    }
    setExplainedId(snippet.id);
    setIsExplaining(true);
    setExplanationText(null);
    setExplainProvider(null);
    try {
      const result = await api.ai({
        kind: "explain",
        platform: "claude",
        prompt: `Explain the snippet titled "${snippet.title}" written in ${snippet.language}.`,
        context: snippet.code,
      });
      setExplanationText(result.output);
      setExplainProvider(result.provider);
    } catch (err) {
      setExplanationText(`Could not run AI explain: ${(err as Error).message}`);
      toast.error("AI explain failed");
    } finally {
      setIsExplaining(false);
    }
  }

  const filteredSnippets = snippets.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.tags ?? []).some((t) => t.includes(q));
    const matchesLang =
      selectedLanguage === "all" || s.language.toLowerCase() === selectedLanguage.toLowerCase();
    const matchesTag = !selectedTag || (s.tags ?? []).includes(selectedTag);
    return matchesSearch && matchesLang && matchesTag;
  });

  // All distinct tags across snippets, sorted.
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    snippets.forEach((s) => (s.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [snippets]);

  // Build language counts from all snippets (not filtered)
  const langCounts = React.useMemo(() => {
    const c: Record<string, number> = { all: snippets.length };
    snippets.forEach((s) => {
      const k = s.language.toLowerCase();
      c[k] = (c[k] ?? 0) + 1;
    });
    return c;
  }, [snippets]);

  const languages = ["all", ...Object.keys(langCounts).filter((l) => l !== "all")];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search snippets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => {
              const active = selectedLanguage === lang;
              const tone = lang === "all" ? "oklch(0.58 0.15 155)" : langTone(lang);
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all",
                    active
                      ? "text-white shadow-[var(--shadow-soft)]"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                  style={active ? { background: tone } : undefined}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: active ? "white" : tone, opacity: active ? 0.9 : 1 }}
                  />
                  {lang}
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1 text-[9px]",
                      active ? "bg-white/20" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {langCounts[lang] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={() => setShowAddForm((v) => !v)}
          className="gap-1.5 self-start md:self-auto"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Cancel" : "Add snippet"}
        </Button>
      </div>

      {allTags.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Tag className="h-3 w-3" /> Tags:
          </span>
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {allTags.map((t) => {
            const active = selectedTag === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTag(active ? null : t)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted",
                )}
              >
                #{t}
              </button>
            );
          })}
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTitle.trim() || !newCode.trim()) return;
            createMutation.mutate();
          }}
          className="surface-card mb-6 animate-[var(--animate-scale-in)] space-y-4 p-5"
        >
          <h3 className="font-display text-sm font-semibold">Create a new snippet</h3>
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
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Tags</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="hook, performance, ssr (comma separated)"
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Code *</label>
            <textarea
              required
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Paste your source code here…"
              className="min-h-[150px] w-full rounded-md border border-input bg-card p-3 font-mono text-xs focus:border-ring focus:outline-none"
              spellCheck={false}
            />
          </div>

          {createMutation.isError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {(createMutation.error as Error).message}
            </div>
          )}

          <Button type="submit" size="sm" className="gap-1.5" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Save snippet
          </Button>
        </form>
      )}

      {filteredSnippets.length === 0 ? (
        <EmptyState
          icon={Code2}
          title={snippets.length === 0 ? "No snippets yet" : "No matches"}
          description={
            snippets.length === 0
              ? "Save reusable code with descriptions, search, and AI explanations."
              : `Try clearing the filter or different search terms.`
          }
          action={
            snippets.length === 0 && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowAddForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Add snippet
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4">
          {filteredSnippets.map((snip) => {
            const isCopying = copiedId === snip.id;
            const isExplainingThis = explainedId === snip.id;
            const isExpanded = expandedIds.has(snip.id);
            const tone = langTone(snip.language);
            const lines = snip.code.split("\n");
            const visibleLines = isExpanded ? lines : lines.slice(0, 12);
            const hasMore = lines.length > 12;

            return (
              <div
                key={snip.id}
                id={snip.id}
                className="surface-card surface-card-hover overflow-hidden border border-border/80"
              >
                <div
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4"
                  style={{
                    background: `linear-gradient(90deg, color-mix(in oklab, ${tone} 6%, transparent), transparent 60%)`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white"
                        style={{ background: tone }}
                      >
                        {snip.language}
                      </span>
                      <h4 className="truncate font-display text-sm font-semibold tracking-tight">
                        {snip.title}
                      </h4>
                    </div>
                    {snip.description && (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {snip.description}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      onClick={() => handleExplain(snip)}
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-primary/30 text-xs text-primary hover:bg-primary/5"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Explain
                    </Button>
                    <Button
                      onClick={() => handleCopy(snip.code, snip.id)}
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 gap-1.5 text-xs"
                    >
                      {isCopying ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleShare(snip)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Share"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm("Delete this snippet?")) deleteMutation.mutate(snip.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className={cn("grid flex-1", isExplainingThis && "lg:grid-cols-[1fr_360px]")}>
                  <div className="relative bg-card/40">
                    <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
                      {visibleLines.map((line, idx) => (
                        <div key={idx} className="group/line flex rounded px-1 hover:bg-muted/40">
                          <span className="w-8 shrink-0 select-none pr-3 text-right text-[10px] font-semibold text-muted-foreground/60">
                            {idx + 1}
                          </span>
                          <span className="whitespace-pre">{line || " "}</span>
                          <button
                            onClick={() => handleCopy(line, snip.id + idx)}
                            className="ml-auto opacity-0 transition-opacity group-hover/line:opacity-100"
                            aria-label="Copy line"
                            title="Copy line"
                          >
                            <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      ))}
                      {hasMore && !isExpanded && (
                        <div className="pointer-events-none absolute inset-x-0 bottom-12 h-16 bg-gradient-to-t from-card to-transparent" />
                      )}
                    </pre>
                    {hasMore && (
                      <button
                        onClick={() => toggleExpand(snip.id)}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-border bg-muted/30 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      >
                        {isExpanded ? (
                          <>
                            <Minimize2 className="h-3 w-3" /> Collapse ({lines.length} lines)
                          </>
                        ) : (
                          <>
                            <Maximize2 className="h-3 w-3" /> Show all {lines.length} lines
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {isExplainingThis && (
                    <div className="flex animate-[var(--animate-scale-in)] flex-col gap-3 border-t border-border bg-primary/5 p-5 lg:border-l lg:border-t-0">
                      {isExplaining ? (
                        <div className="my-auto flex flex-col items-center justify-center gap-2 py-8">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-[11px] text-muted-foreground">
                            Analyzing snippet…
                          </span>
                        </div>
                      ) : (
                        <div className="relative flex h-full flex-col">
                          <div className="flex items-center justify-between">
                            <span className="chip tone-info">
                              <Sparkles className="h-3 w-3" />
                              {explainProvider === "openai" ? "OpenAI" : "Local fallback"}
                            </span>
                            <button
                              onClick={() => {
                                setExplainedId(null);
                                setExplanationText(null);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Dismiss"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-3 whitespace-pre-wrap text-xs leading-relaxed pr-1">
                            {explanationText}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 bg-muted/10 px-5 py-2.5 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> {snip.author.name}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Updated {formatRelative(snip.updatedAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {(snip.tags ?? []).length > 0 ? (
                      (snip.tags ?? []).map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/20"
                        >
                          #{t}
                        </button>
                      ))
                    ) : (
                      <span className="text-[10px] italic text-muted-foreground/70">no tags</span>
                    )}
                    <button
                      onClick={() => {
                        const next = prompt(
                          "Tags (comma or space separated)",
                          (snip.tags ?? []).join(", "),
                        );
                        if (next === null) return;
                        const parsed = next
                          .split(/[,\s]+/)
                          .map((t) => t.trim().toLowerCase())
                          .filter(Boolean);
                        setTagsMutation.mutate({ id: snip.id, tags: parsed });
                      }}
                      className="inline-flex items-center gap-0.5 rounded px-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit tags"
                    >
                      <Tag className="h-2.5 w-2.5" /> edit
                    </button>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground/60">
                    #{snip.id.slice(-6)}
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
