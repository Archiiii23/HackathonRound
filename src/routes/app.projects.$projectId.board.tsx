import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { TaskDrawer } from "@/components/app/TaskDrawer";
import { qk, tasksQuery } from "@/lib/queries";
import {
  api,
  PRIORITY_META,
  STATUS_META,
  type LabelTone,
  type Status,
  type TaskRow,
} from "@/lib/api";
import {
  Plus,
  Filter,
  Calendar as CalIcon,
  X,
  Kanban,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLUMNS: { key: Status; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "In review" },
  { key: "done", label: "Done" },
];

const searchSchema = z.object({ new: z.string().optional() });

export const Route = createFileRoute("/app/projects/$projectId/board")({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(tasksQuery(params.projectId));
  },
  component: BoardView,
});

function BoardView() {
  const { projectId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  const tasks = data.tasks;
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overCol, setOverCol] = React.useState<Status | null>(null);
  const [showCreate, setShowCreate] = React.useState<Status | null>(
    search?.new === "1" ? "todo" : null,
  );
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [quickAddCol, setQuickAddCol] = React.useState<Status | null>(null);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    if (search?.new === "1") {
      setShowCreate("todo");
      navigate({ to: ".", search: {} as never, replace: true });
    }
  }, [search?.new, navigate]);

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api.updateTask(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: qk.tasks(projectId) });
      const prev = queryClient.getQueryData<{ tasks: TaskRow[] }>(qk.tasks(projectId));
      if (prev) {
        queryClient.setQueryData<{ tasks: TaskRow[] }>(qk.tasks(projectId), {
          tasks: prev.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.tasks(projectId), ctx.prev);
      toast.error("Couldn't move task");
    },
    onSuccess: (_d, vars) => {
      toast.success(`Moved to ${STATUS_META[vars.status].label}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
    },
  });

  function handleDrop(col: Status) {
    if (!dragId) return;
    const cur = tasks.find((t) => t.id === dragId);
    if (cur && cur.status !== col) {
      updateStatus.mutate({ id: dragId, status: col });
    }
    setDragId(null);
    setOverCol(null);
  }

  const filtered = filter
    ? tasks.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()))
    : tasks;

  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null;

  return (
    <div className="mx-auto max-w-[1480px] px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tasks…"
              className="h-9 w-56 rounded-md border border-input bg-card pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />
          </div>
          <div className="hidden text-xs text-muted-foreground sm:block">
            {filtered.length} of {tasks.length} tasks
          </div>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreate("todo")}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title="Your board is empty"
          description="Add your first task to start tracking work across statuses."
          action={
            <Button size="sm" onClick={() => setShowCreate("todo")} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create task
            </Button>
          }
        />
      ) : (
        <div className="scroll-snap-x grid auto-cols-[320px] grid-flow-col gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {COLUMNS.map((col) => {
            const items = filtered.filter((t) => t.status === col.key);
            const isOver = overCol === col.key;
            const colTone = STATUS_META[col.key].color;
            return (
              <div
                key={col.key}
                className="scroll-snap-start flex flex-col rounded-xl border border-border bg-muted/30"
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => handleDrop(col.key)}
              >
                <div className="sticky top-14 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-card/85 px-3 py-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <Pill color={colTone}>{col.label}</Pill>
                    <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Add card"
                    onClick={() => setQuickAddCol(col.key)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div
                  className={cn(
                    "relative flex min-h-[200px] flex-1 flex-col gap-2 p-2 transition-colors",
                    isOver && "bg-primary/[0.04]",
                  )}
                >
                  {isOver && (
                    <div
                      className="pointer-events-none absolute inset-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/[0.02]"
                      aria-hidden
                    />
                  )}
                  {items.map((t) => (
                    <article
                      key={t.id}
                      draggable
                      onClick={() => setSelectedTaskId(t.id)}
                      onDragStart={(e) => {
                        setDragId(t.id);
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      className={cn(
                        "group cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)] active:cursor-grabbing",
                        dragId === t.id && "rotate-[1deg] opacity-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          #{t.id.slice(-6)}
                        </span>
                        <Pill color={PRIORITY_META[t.priority].color} size="sm">
                          {PRIORITY_META[t.priority].label}
                        </Pill>
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
                        {t.title}
                      </div>
                      {t.labels.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.labels.slice(0, 3).map((l) => (
                            <LabelChip key={l.name} tone={l.tone}>
                              {l.name}
                            </LabelChip>
                          ))}
                          {t.labels.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{t.labels.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {t.due && (
                            <span className="inline-flex items-center gap-1">
                              <CalIcon className="h-3 w-3" />
                              {new Date(t.due).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        {t.assignee && (
                          <Avatar
                            initials={t.assignee.initials}
                            color={t.assignee.avatarColor}
                            size={22}
                          />
                        )}
                      </div>
                    </article>
                  ))}
                  {items.length === 0 && !isOver && (
                    <button
                      onClick={() => setQuickAddCol(col.key)}
                      className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      <Plus className="mb-1 h-4 w-4" />
                      Drop here or add task
                    </button>
                  )}

                  {quickAddCol === col.key && (
                    <QuickAdd
                      projectId={projectId}
                      status={col.key}
                      onClose={() => setQuickAddCol(null)}
                    />
                  )}
                </div>
                <div className="rounded-b-xl border-t border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
                  Total {items.length} • {items.filter((t) => t.priority === "urgent").length}{" "}
                  urgent
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDrawer
        task={selectedTask}
        projectIdOrSlug={projectId}
        open={!!selectedTaskId}
        onOpenChange={(o) => !o && setSelectedTaskId(null)}
      />

      {showCreate && (
        <CreateTaskDialog
          projectId={projectId}
          defaultStatus={showCreate}
          onClose={() => setShowCreate(null)}
        />
      )}
    </div>
  );
}

function QuickAdd({
  projectId,
  status,
  onClose,
}: {
  projectId: string;
  status: Status;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const mutation = useMutation({
    mutationFn: () => api.createTask(projectId, { title: title.trim(), status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      toast.success("Task added");
      setTitle("");
      inputRef.current?.focus();
    },
    onError: () => toast.error("Couldn't add task"),
  });

  return (
    <div className="rounded-lg border border-primary/30 bg-card p-2 shadow-[var(--shadow-soft)] animate-[var(--animate-rise-in)]">
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="block w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
          if (e.key === "Enter" && title.trim().length >= 2) {
            e.preventDefault();
            mutation.mutate();
          }
        }}
      />
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CornerDownLeft className="h-3 w-3" /> Save
          <span className="ml-2 inline-flex items-center gap-1">
            <span className="kbd">esc</span> close
          </span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onClose}
            className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
          <Button
            size="sm"
            className="h-6 px-2 text-[11px]"
            disabled={mutation.isPending || title.trim().length < 2}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

const LABEL_TONES: LabelTone[] = ["green", "blue", "yellow", "red", "gray"];

function CreateTaskDialog({
  projectId,
  defaultStatus,
  onClose,
}: {
  projectId: string;
  defaultStatus: Status;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState<"low" | "medium" | "high" | "urgent">("medium");
  const [status, setStatus] = React.useState<Status>(defaultStatus);
  const [labelInput, setLabelInput] = React.useState("");
  const [labels, setLabels] = React.useState<{ name: string; tone: LabelTone }[]>([]);

  const mutation = useMutation({
    mutationFn: () =>
      api.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        labels: labels.length ? labels : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      toast.success(`Task "${title}" created`);
      onClose();
    },
    onError: () => toast.error("Couldn't create task"),
  });

  function addLabel() {
    const name = labelInput.trim().toLowerCase();
    if (!name) return;
    const tone = LABEL_TONES[labels.length % LABEL_TONES.length];
    setLabels((l) => [...l, { name, tone }]);
    setLabelInput("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md animate-[var(--animate-fade-in)]"
      onClick={onClose}
    >
      <form
        className="relative w-full max-w-lg rounded-2xl border border-border bg-popover p-6 shadow-[var(--shadow-floating)] animate-[var(--animate-scale-in)]"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length < 2) return;
          mutation.mutate();
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 className="font-display text-lg font-semibold">New task</h2>
        <p className="text-xs text-muted-foreground">
          It will go straight to your column of choice.
        </p>
        <div className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-medium" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
              placeholder="Implement SSO login flow"
              className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add context, acceptance criteria…"
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm focus:border-ring focus:outline-none"
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" htmlFor="priority">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high" | "urgent")
                }
                className="mt-1 h-10 w-full rounded-lg border border-input bg-card px-2 text-sm focus:border-ring focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">Labels</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="frontend"
                className="h-9 flex-1 rounded-lg border border-input bg-card px-3 text-sm focus:border-ring focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLabel();
                  }
                }}
              />
              <Button type="button" size="sm" variant="outline" onClick={addLabel}>
                Add
              </Button>
            </div>
            {labels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {labels.map((l, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLabels((all) => all.filter((_, j) => j !== i))}
                    className="group"
                  >
                    <LabelChip tone={l.tone}>
                      {l.name} <X className="ml-1 inline h-2.5 w-2.5 opacity-60" />
                    </LabelChip>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {mutation.isError && (
          <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {(mutation.error as Error).message}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || title.trim().length < 2}
            className="gap-1.5"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Add task
          </Button>
        </div>
      </form>
    </div>
  );
}
