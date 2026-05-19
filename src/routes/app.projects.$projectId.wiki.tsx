import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { mockWikiPages, type WikiPage } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Save,
  Sparkles,
  ChevronRight,
  FileText,
  Clock,
  User,
  X,
  Heading,
} from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/wiki")({
  component: WikiView,
});

function WikiView() {
  const [pages, setPages] = React.useState<WikiPage[]>(mockWikiPages);
  const [selectedId, setSelectedId] = React.useState<string>(mockWikiPages[0].id);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Editing State
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");

  // AI Summary State
  const [aiSummary, setAiSummary] = React.useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = React.useState(false);

  const selectedPage = pages.find((p) => p.id === selectedId) ?? pages[0];

  React.useEffect(() => {
    if (selectedPage) {
      setEditTitle(selectedPage.title);
      setEditContent(selectedPage.content);
      setEditCategory(selectedPage.category);
      setAiSummary(null);
    }
  }, [selectedId, selectedPage]);

  function handleSave() {
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? {
              ...p,
              title: editTitle,
              content: editContent,
              category: editCategory,
              lastUpdated: "Just now",
            }
          : p,
      ),
    );
    setIsEditing(false);
  }

  function handleCreateNew() {
    const newId = `W-${100 + pages.length + 1}`;
    const newPage: WikiPage = {
      id: newId,
      title: "Untitled Page",
      slug: `untitled-${pages.length + 1}`,
      category: "General",
      author: "Mira Chen",
      lastUpdated: "Just now",
      content: `# Untitled Page\n\nStart writing your content here...`,
    };
    setPages((prev) => [...prev, newPage]);
    setSelectedId(newId);
    setIsEditing(true);
  }

  // Simulated AI Summary Engine
  function runAiSummary() {
    setIsSummarizing(true);
    setAiSummary(null);
    setTimeout(() => {
      setIsSummarizing(false);
      const bulletPoints = selectedPage.content
        .split("\n")
        .filter((line) => line.trim().startsWith("-") || line.trim().startsWith("#"))
        .slice(0, 4)
        .map((line) => line.replace(/[#\-*]/g, "").trim())
        .filter(Boolean);

      if (bulletPoints.length === 0) {
        bulletPoints.push("Detailed developer and setup parameters for the workspace.");
      }

      setAiSummary(
        `### 🚀 AI Summary (Gemini 1.5 Pro)\n\nHere is a quick overview of **${selectedPage.title}**:\n\n` +
          bulletPoints.map((bp) => `* **Key Focus**: ${bp}`).join("\n") +
          `\n\n* **Author Context**: Documented by **${selectedPage.author}** and last modified **${selectedPage.lastUpdated}**.`,
      );
    }, 1500);
  }

  // Filters pages based on document tree search query
  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Group pages by category
  const categories = Array.from(new Set(filteredPages.map((p) => p.category)));

  // Extract headings for Table of Contents
  const headings = selectedPage.content
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace("## ", "").trim());

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6 border-t border-border">
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Sidebar Document Tree */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="surface-card p-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search wiki docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              />
            </div>
            <Button
              onClick={handleCreateNew}
              size="sm"
              className="w-full gap-1.5 shadow-[var(--shadow-soft)]"
            >
              <Plus className="h-4 w-4" /> New page
            </Button>
          </div>

          <div className="surface-card p-3 flex flex-col gap-4 overflow-y-auto max-h-[500px]">
            {categories.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No documents found
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
                            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                              active
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
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

        {/* Center Main Panel (Viewer/Editor) */}
        <main className="lg:col-span-7 flex flex-col gap-4">
          <div className="surface-card p-6 min-h-[550px] relative flex flex-col">
            {/* Main Header Buttons */}
            <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                  {selectedPage.category}
                </span>
                <h2 className="mt-1 font-display text-xl font-bold tracking-tight">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="border-b border-border bg-transparent focus:border-primary focus:outline-none"
                    />
                  ) : (
                    selectedPage.title
                  )}
                </h2>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> {selectedPage.author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Updated {selectedPage.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={runAiSummary}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                  disabled={isSummarizing}
                >
                  <Sparkles
                    className={`h-4 w-4 text-primary ${isSummarizing ? "animate-pulse" : ""}`}
                  />
                  AI Summary
                </Button>
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm" className="gap-1.5">
                      <Save className="h-4 w-4" /> Save
                    </Button>
                    <Button
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Edit2 className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>
            </div>

            {/* AI Summary Panel */}
            {(isSummarizing || aiSummary) && (
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-[var(--shadow-soft)] animate-[var(--animate-scale-in)]">
                {isSummarizing ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Sparkles className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      Gemini is summarizing document details...
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setAiSummary(null)}
                      className="absolute right-0 top-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="prose prose-sm dark:prose-invert font-sans text-xs leading-relaxed text-foreground whitespace-pre-line">
                      {aiSummary}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Document Content */}
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center gap-2 rounded border border-input bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
                    <Heading className="h-3.5 w-3.5" /> Category:
                    <input
                      type="text"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      placeholder="General"
                      className="bg-transparent font-medium text-foreground focus:outline-none"
                    />
                  </div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-card p-3 font-mono text-xs focus:border-ring focus:outline-none"
                  />
                </div>
              ) : (
                <div className="prose dark:prose-invert font-sans text-xs leading-relaxed text-foreground space-y-4">
                  {selectedPage.content.split("\n\n").map((para, i) => {
                    if (para.startsWith("# ")) {
                      return null; // Don't double render main H1
                    }
                    if (para.startsWith("## ")) {
                      return (
                        <h3
                          key={i}
                          className="font-display text-sm font-semibold border-b border-border pb-1 mt-6 text-foreground"
                        >
                          {para.replace("## ", "")}
                        </h3>
                      );
                    }
                    if (para.startsWith("- ") || para.startsWith("* ")) {
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                          {para.split("\n").map((line, j) => (
                            <li key={j}>{line.replace(/^[-*]\s+/, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (para.startsWith("```")) {
                      const lines = para.split("\n");
                      const code = lines.slice(1, -1).join("\n");
                      return (
                        <pre
                          key={i}
                          className="overflow-x-auto rounded bg-muted/60 p-3 font-mono text-[11px] border border-border text-foreground leading-normal my-4"
                        >
                          {code}
                        </pre>
                      );
                    }
                    return (
                      <p key={i} className="text-muted-foreground">
                        {para}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Table of Contents Pane */}
        <aside className="lg:col-span-2 hidden lg:flex flex-col gap-4">
          <div className="surface-card p-4">
            <h4 className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Table of Contents
            </h4>
            {headings.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground italic">No subheaders</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs font-medium">
                {headings.map((h, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-3 w-3 text-primary/60 shrink-0" />
                    <a href="#" className="truncate">
                      {h}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
