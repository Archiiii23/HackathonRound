import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { qk, wikiQuery, wikiVersionsQuery } from "@/lib/queries";
import { api, formatRelative, type WikiPageRow } from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar } from "@/components/app/StatusBadge";
import {
  Search,
  Plus,
  Edit2,
  Save,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  User as UserIcon,
  X,
  Trash2,
  Loader2,
  Check,
  BookOpen,
  Eye,
  Columns2,
  CornerDownLeft,
  History,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId/wiki")({
  loader: async ({ context, params }) => {
    await safeEnsureQueryData(context.queryClient, {
      queryKey: qk.wiki(params.projectId),
      queryFn: () => api.wiki(params.projectId),
      fallback: { pages: [] },
    });
  },
  component: WikiView,
});

function WikiView() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(wikiQuery(projectId));
  const pages = data.pages;

  const [selectedId, setSelectedId] = React.useState<string | null>(pages[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editorMode, setEditorMode] = React.useState<"split" | "edit" | "preview">("split");
  const [dirty, setDirty] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = React.useState(false);
  const [aiProvider, setAiProvider] = React.useState<string | null>(null);
  const [showHistory, setShowHistory] = React.useState(false);

  React.useEffect(() => {
    if (!selectedId && pages[0]) setSelectedId(pages[0].id);
  }, [pages, selectedId]);

  const selectedPage: WikiPageRow | undefined = pages.find((p) => p.id === selectedId);

  React.useEffect(() => {
    if (selectedPage) {
      setEditTitle(selectedPage.title);
      setEditContent(selectedPage.content);
      setEditCategory(selectedPage.category);
      setAiSummary(null);
      setAiProvider(null);
      setDirty(false);
      setSavedAt(null);
    }
  }, [selectedId, selectedPage]);

  const saveMutation = useMutation({
    mutationFn: () =>
      selectedPage
        ? api.updateWiki(selectedPage.id, {
            title: editTitle.trim(),
            content: editContent,
            category: editCategory.trim() || "General",
          })
        : Promise.reject(new Error("No selection")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.wiki(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      setSavedAt(Date.now());
      setDirty(false);
    },
    onError: () => toast.error("Couldn't save page"),
  });

  // Autosave while editing
  React.useEffect(() => {
    if (!isEditing || !dirty || !selectedPage) return;
    const t = setTimeout(() => saveMutation.mutate(), 900);
    return () => clearTimeout(t);
  }, [editTitle, editContent, editCategory, isEditing, dirty, selectedPage, saveMutation]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.createWiki(projectId, {
        title: "Untitled Page",
        content: `# Untitled Page\n\n## Overview\n\nStart writing your content here…\n\n## Notes\n\n- Add a bullet\n- Or another\n`,
        category: "General",
      }),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: qk.wiki(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      setSelectedId(id);
      setIsEditing(true);
      toast.success("Page created");
    },
    onError: () => toast.error("Couldn't create page"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteWiki(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.wiki(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      setSelectedId(null);
      setIsEditing(false);
      toast.success("Page deleted");
    },
    onError: () => toast.error("Couldn't delete"),
  });

  async function runAiSummary() {
    if (!selectedPage) return;
    setIsSummarizing(true);
    setAiSummary(null);
    setAiProvider(null);
    try {
      const result = await api.ai({
        kind: "summary",
        platform: "gemini",
        prompt: `Summarize the wiki page titled "${selectedPage.title}".`,
        context: selectedPage.content,
      });
      setAiSummary(result.output);
      setAiProvider(result.provider);
    } catch (err) {
      setAiSummary(`Could not run AI summary: ${(err as Error).message}`);
      toast.error("AI summary failed");
    } finally {
      setIsSummarizing(false);
    }
  }

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const categories = Array.from(new Set(filteredPages.map((p) => p.category)));

  const headings = (selectedPage?.content ?? "")
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace("## ", "").trim());

  return (
    <div className="mx-auto max-w-[1480px] px-6 py-6">
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-3">
          <div className="surface-card flex flex-col gap-3 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search wiki…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              size="sm"
              className="w-full gap-1.5"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              New page
            </Button>
          </div>

          <div className="surface-card flex max-h-[600px] flex-col gap-3 overflow-y-auto p-3">
            {categories.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {pages.length === 0 ? "No pages yet" : "No matches"}
              </div>
            ) : (
              categories.map((cat) => (
                <div key={cat} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {cat}
                  </div>
                  <div className="space-y-0.5">
                    {filteredPages
                      .filter((p) => p.category === cat)
                      .map((p) => {
                        const active = p.id === selectedId;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setSelectedId(p.id);
                              setIsEditing(false);
                            }}
                            className={cn(
                              "group relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors",
                              active
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                            )}
                          >
                            {active && (
                              <span
                                className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-primary"
                                aria-hidden
                              />
                            )}
                            <FileText
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                active ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span className="truncate">{p.title}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main pane */}
        <main className="flex flex-col gap-4 lg:col-span-7">
          <div className="relative flex min-h-[600px] flex-col surface-card p-0">
            {selectedPage ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                  <div className="min-w-0">
                    <span className="chip">{selectedPage.category}</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => {
                          setEditTitle(e.target.value);
                          setDirty(true);
                        }}
                        className="mt-1 block w-full bg-transparent font-display text-xl font-bold tracking-tight focus:outline-none"
                      />
                    ) : (
                      <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                        {selectedPage.title}
                      </h2>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" /> {selectedPage.author?.name ?? "Unknown"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Updated{" "}
                        {formatRelative(selectedPage.updatedAt)}
                      </span>
                      {isEditing && (
                        <span className="inline-flex items-center gap-1">
                          {saveMutation.isPending ? (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                            </span>
                          ) : savedAt && !dirty ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <Check className="h-3 w-3" /> Saved
                            </span>
                          ) : dirty ? (
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Unsaved
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isEditing && (
                      <div className="hidden gap-0.5 rounded-md border border-border p-0.5 md:flex">
                        {[
                          { id: "edit" as const, icon: Edit2, label: "Edit" },
                          { id: "split" as const, icon: Columns2, label: "Split" },
                          { id: "preview" as const, icon: Eye, label: "Preview" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            onClick={() => setEditorMode(m.id)}
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
                              editorMode === m.id
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            title={m.label}
                            aria-label={m.label}
                          >
                            <m.icon className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    )}
                    <Button
                      onClick={runAiSummary}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                      disabled={isSummarizing}
                    >
                      <Sparkles className={cn("h-3.5 w-3.5", isSummarizing && "animate-pulse")} />
                      Summarize
                    </Button>
                    {isEditing ? (
                      <Button
                        onClick={() => setIsEditing(false)}
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> Done
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setShowHistory(true)}
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <History className="h-3.5 w-3.5" /> History
                        </Button>
                        <Button
                          onClick={() => setIsEditing(true)}
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm("Delete this wiki page?")) {
                              deleteMutation.mutate(selectedPage.id);
                            }
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          aria-label="Delete page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* AI summary panel */}
                {(isSummarizing || aiSummary) && (
                  <div className="mx-4 mt-4 animate-[var(--animate-rise-in)] rounded-lg border border-primary/30 bg-primary/5 p-4">
                    {isSummarizing ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Summarizing document…</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setAiSummary(null)}
                          className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                          aria-label="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="chip tone-info">
                            <Sparkles className="h-3 w-3" />
                            {aiProvider === "openai" ? "OpenAI" : "Local fallback"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">AI summary</span>
                        </div>
                        <div className="whitespace-pre-wrap text-xs leading-relaxed">
                          {aiSummary}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Editor / Preview */}
                <div className="flex-1 overflow-hidden">
                  {isEditing ? (
                    <div
                      className={cn(
                        "flex h-full",
                        editorMode === "split"
                          ? "divide-x divide-border md:grid md:grid-cols-2"
                          : "flex-col",
                      )}
                    >
                      {(editorMode === "edit" || editorMode === "split") && (
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span className="font-mono">Category:</span>
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => {
                                  setEditCategory(e.target.value);
                                  setDirty(true);
                                }}
                                placeholder="General"
                                className="bg-transparent font-medium text-foreground focus:outline-none"
                              />
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px]">
                              <span className="kbd">⌘</span>+<span className="kbd">↵</span> save
                            </span>
                          </div>
                          <textarea
                            value={editContent}
                            onChange={(e) => {
                              setEditContent(e.target.value);
                              setDirty(true);
                            }}
                            onKeyDown={(e) => {
                              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault();
                                saveMutation.mutate();
                              }
                            }}
                            spellCheck={false}
                            className="block min-h-[440px] w-full flex-1 resize-none bg-card p-4 font-mono text-[12.5px] leading-relaxed text-foreground focus:outline-none"
                          />
                        </div>
                      )}
                      {(editorMode === "preview" || editorMode === "split") && (
                        <div className="flex-1 overflow-y-auto bg-background/40 p-5">
                          <MarkdownView content={editContent} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-y-auto p-5">
                      <MarkdownView content={selectedPage.content} />
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-4 py-2">
                    <div className="text-[11px] text-muted-foreground">
                      Autosave on • last saved{" "}
                      {savedAt ? formatRelative(savedAt) : formatRelative(selectedPage.updatedAt)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending || !dirty}
                      className="gap-1.5"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save now
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-12">
                <EmptyState
                  icon={BookOpen}
                  title={pages.length === 0 ? "No wiki pages yet" : "Pick a page from the left"}
                  description={
                    pages.length === 0
                      ? "Capture decisions, runbooks, and onboarding docs in one place."
                      : "Or create a new one to start writing."
                  }
                  action={
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => createMutation.mutate()}
                      disabled={createMutation.isPending}
                    >
                      <Plus className="h-3.5 w-3.5" /> Create page
                    </Button>
                  }
                  className="w-full max-w-md border-0 bg-transparent"
                />
              </div>
            )}
          </div>
        </main>

        {/* TOC */}
        <aside className="hidden flex-col gap-4 lg:col-span-2 lg:flex">
          <div className="surface-card sticky top-20 p-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              On this page
            </h4>
            {headings.length === 0 ? (
              <p className="mt-2 text-xs italic text-muted-foreground">No sub-headings</p>
            ) : (
              <ul className="mt-3 space-y-1 text-xs font-medium">
                {headings.map((h, i) => (
                  <li key={i}>
                    <a
                      href={`#${slugify(h)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document
                          .getElementById(slugify(h))
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="group flex items-center gap-1.5 rounded px-1.5 py-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-primary/60 transition-transform group-hover:translate-x-0.5" />
                      <span className="truncate">{h}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-border pt-3 text-[10px] text-muted-foreground">
              Tip: press <span className="kbd">⌘</span> <span className="kbd">↵</span> to save while
              editing.
            </div>
          </div>
        </aside>
      </div>
      {selectedPage && (
        <WikiHistorySheet
          pageId={selectedPage.id}
          pageTitle={selectedPage.title}
          open={showHistory}
          onOpenChange={setShowHistory}
          onReverted={() => {
            queryClient.invalidateQueries({ queryKey: qk.wiki(projectId) });
            queryClient.invalidateQueries({ queryKey: qk.wikiVersions(selectedPage.id) });
            queryClient.invalidateQueries({ queryKey: qk.activity });
          }}
        />
      )}
    </div>
  );
}

function WikiHistorySheet({
  pageId,
  pageTitle,
  open,
  onOpenChange,
  onReverted,
}: {
  pageId: string;
  pageTitle: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onReverted: () => void;
}) {
  const versions = useQuery({ ...wikiVersionsQuery(pageId), enabled: open });
  const [preview, setPreview] = React.useState<string | null>(null);
  const [reverting, setReverting] = React.useState<string | null>(null);

  async function revert(versionId: string) {
    if (!confirm("Revert page to this version? Current content will be snapshotted first.")) return;
    setReverting(versionId);
    try {
      await api.revertWiki(pageId, versionId);
      toast.success("Page reverted");
      onReverted();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't revert");
    } finally {
      setReverting(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Version history</h2>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{pageTitle}</p>
        </header>
        <div className="flex-1 overflow-y-auto">
          {versions.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-lg" />
              ))}
            </div>
          ) : (versions.data?.versions ?? []).length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No version history yet. Edits will start being tracked from now on.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {(versions.data?.versions ?? []).map((v) => (
                <li key={v.id} className="space-y-2 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar initials={v.author?.initials ?? "??"} color={v.author?.avatarColor ?? "oklch(0.65 0.14 240)"} size={28} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="truncate font-medium">{v.title}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {v.author?.name ?? "Unknown"} · {formatRelative(v.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => setPreview(preview === v.id ? null : v.id)}
                      className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted/40"
                    >
                      {preview === v.id ? "Hide" : "Preview"}
                    </button>
                    <button
                      onClick={() => revert(v.id)}
                      disabled={reverting === v.id}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] text-primary-foreground hover:opacity-90 disabled:opacity-60"
                    >
                      {reverting === v.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Revert
                    </button>
                  </div>
                  {preview === v.id && (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px] leading-relaxed">
                      {v.content || "(empty)"}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function MarkdownView({ content }: { content: string }) {
  // Light-weight inline formatter for **bold**, *italic*, `code`, [link](url)
  const inline = (text: string) => {
    const parts: React.ReactNode[] = [];
    const re = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = re.exec(text))) {
      if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
      if (m[2]) parts.push(<strong key={key++}>{m[2]}</strong>);
      else if (m[4]) parts.push(<em key={key++}>{m[4]}</em>);
      else if (m[6])
        parts.push(
          <code
            key={key++}
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {m[6]}
          </code>,
        );
      else if (m[8] && m[9])
        parts.push(
          <a
            key={key++}
            href={m[9]}
            className="text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            {m[8]}
          </a>,
        );
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  };

  const blocks = content.split(/\n\n+/);
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground">
      {blocks.map((para, i) => {
        if (!para.trim()) return null;
        if (para.startsWith("# ")) {
          return (
            <h1
              key={i}
              className="font-display text-2xl font-bold tracking-tight"
              id={slugify(para.replace("# ", ""))}
            >
              {para.replace("# ", "")}
            </h1>
          );
        }
        if (para.startsWith("## ")) {
          const text = para.replace("## ", "").trim();
          return (
            <h2
              key={i}
              id={slugify(text)}
              className="mt-6 border-b border-border pb-2 font-display text-base font-semibold tracking-tight"
            >
              {text}
            </h2>
          );
        }
        if (para.startsWith("### ")) {
          return (
            <h3 key={i} className="font-display text-sm font-semibold">
              {para.replace("### ", "")}
            </h3>
          );
        }
        if (para.startsWith("- ") || para.startsWith("* ")) {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 text-muted-foreground">
              {para.split("\n").map((line, j) => (
                <li key={j}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        if (para.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground"
            >
              {inline(para.replace(/^> /, ""))}
            </blockquote>
          );
        }
        if (para.startsWith("```")) {
          const lines = para.split("\n");
          const lang = lines[0].replace("```", "").trim();
          const code = lines
            .slice(1, lines[lines.length - 1] === "```" ? -1 : undefined)
            .join("\n");
          return (
            <div key={i} className="code-block">
              {lang && (
                <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success("Copied");
                    }}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <CornerDownLeft className="h-3 w-3" /> Copy
                  </button>
                </div>
              )}
              <pre className="overflow-x-auto p-3 font-mono text-[12px] leading-relaxed">
                {code}
              </pre>
            </div>
          );
        }
        return (
          <p key={i} className="text-foreground/90">
            {inline(para)}
          </p>
        );
      })}
    </div>
  );
}



