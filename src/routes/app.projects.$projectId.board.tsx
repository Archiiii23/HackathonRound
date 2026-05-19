import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { mockTasks, statusMeta, priorityMeta, type Status, type Task } from "@/lib/mock-data";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Filter, MessageSquare, Calendar as CalIcon, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/board")({
  component: BoardView,
});

const columns: { key: Status; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "In review" },
  { key: "done", label: "Done" },
];

function BoardView() {
  const [tasks, setTasks] = React.useState<Task[]>(mockTasks);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<Status | null>(null);

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragEnd() {
    setDragId(null);
    setOverCol(null);
  }
  function onDrop(col: Status) {
    if (!dragId) return;
    setTasks((prev) => prev.map((t) => (t.id === dragId ? { ...t, status: col } : t)));
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Button>
          <Button variant="ghost" size="sm">
            Group: Status
          </Button>
        </div>
        <div className="hidden gap-1 rounded-md border border-border p-0.5 md:flex">
          {["Board", "List", "Calendar"].map((v, i) => (
            <button
              key={v}
              className={`h-7 rounded px-2.5 text-xs font-medium transition-colors ${i === 0 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      <div className="grid grid-flow-col auto-cols-[300px] gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          const isOver = overCol === col.key;
          return (
            <div key={col.key} className="flex flex-col rounded-lg bg-muted/40">
              <div className="sticky top-14 z-10 flex items-center justify-between border-b border-border bg-muted/80 px-3 py-2.5 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Pill color={statusMeta[col.key].color}>{col.label}</Pill>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Add card">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => onDrop(col.key)}
                className={`flex min-h-[200px] flex-col gap-2 p-2 transition-colors ${isOver ? "bg-primary/5" : ""}`}
              >
                {items.map((t) => (
                  <article
                    key={t.id}
                    draggable
                    onDragStart={() => onDragStart(t.id)}
                    onDragEnd={onDragEnd}
                    className={`group cursor-grab rounded-md border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] active:cursor-grabbing ${dragId === t.id ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">{t.id}</span>
                      <Pill color={priorityMeta[t.priority].color}>
                        {priorityMeta[t.priority].label}
                      </Pill>
                    </div>
                    <div className="mt-1 text-sm font-medium leading-snug">{t.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.labels.map((l) => (
                        <LabelChip key={l.name} tone={l.tone}>
                          {l.name}
                        </LabelChip>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {t.due && (
                          <span className="inline-flex items-center gap-1">
                            <CalIcon className="h-3 w-3" />
                            {t.due}
                          </span>
                        )}
                        {t.comments > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {t.comments}
                          </span>
                        )}
                      </div>
                      <Avatar initials={t.assignee.initials} color={t.assignee.color} />
                    </div>
                  </article>
                ))}
                {items.length === 0 && (
                  <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
