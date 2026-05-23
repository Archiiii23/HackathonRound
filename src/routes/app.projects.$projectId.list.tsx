import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/EmptyState";
import { TaskDrawer } from "@/components/app/TaskDrawer";
import { qk, tasksQuery } from "@/lib/queries";
import { api, PRIORITY_META, STATUS_META, type Status } from "@/lib/api";
import {
  Filter,
  Plus,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  X,
  ListTodo,
  Rows3,
  Rows4,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId/list")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(tasksQuery(params.projectId));
  },
  component: ListView,
});

const STATUSES: Status[] = ["backlog", "todo", "in_progress", "review", "done"];

function ListView() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(tasksQuery(projectId));
  const tasks = data.tasks;
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState("");
  const [density, setDensity] = React.useState<"comfy" | "compact">("comfy");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [sortKey, setSortKey] = React.useState<"updated" | "priority" | "status">("updated");

  const filtered = React.useMemo(() => {
    let list = filter
      ? tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(filter.toLowerCase()) ||
            t.id.toLowerCase().includes(filter.toLowerCase()),
        )
      : [...tasks];
    if (sortKey === "priority") {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      list = list.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (sortKey === "status") {
      const order = { backlog: 0, todo: 1, in_progress: 2, review: 3, done: 4 };
      list = list.sort((a, b) => order[a.status] - order[b.status]);
    } else {
      list = list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return list;
  }, [tasks, filter, sortKey]);

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Status }) => api.updateTask(id, { status }),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      toast.success(`Moved to ${STATUS_META[vars.status].label}`);
    },
    onError: () => toast.error("Couldn't update task"),
  });

  const bulkStatus = useMutation({
    mutationFn: (status: Status) => api.bulkUpdateTasks({ ids: Array.from(selected), status }),
    onSuccess: (d, status) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      toast.success(`${d.count} task(s) → ${STATUS_META[status].label}`);
      setSelected(new Set());
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const bulkDelete = useMutation({
    mutationFn: () => api.bulkDeleteTasks(Array.from(selected)),
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks(projectId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
      toast.success(`${d.count} task(s) deleted`);
      setSelected(new Set());
    },
    onError: () => toast.error("Couldn't delete"),
  });

  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null;
  const rowPad = density === "comfy" ? "py-3" : "py-2";

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
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
          <SortDropdown value={sortKey} onChange={setSortKey} />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden gap-0.5 rounded-md border border-border p-0.5 md:flex">
            <button
              onClick={() => setDensity("comfy")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
                density === "comfy"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Comfortable"
              title="Comfortable"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded transition-colors",
                density === "compact"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Compact"
              title="Compact"
            >
              <Rows4 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Tasks you create on the board will appear here as a sortable list."
        />
      ) : (
        <div className="surface-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-14 z-10 bg-muted/60 backdrop-blur">
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-10 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? new Set(filtered.map((t) => t.id)) : new Set(),
                        )
                      }
                      className="h-4 w-4 rounded border-input accent-[var(--color-primary)]"
                    />
                  </th>
                  <th className="w-20 py-2.5">ID</th>
                  <th className="py-2.5">Title</th>
                  <th className="hidden py-2.5 md:table-cell">Status</th>
                  <th className="hidden py-2.5 lg:table-cell">Priority</th>
                  <th className="hidden py-2.5 lg:table-cell">Labels</th>
                  <th className="hidden py-2.5 md:table-cell">Due</th>
                  <th className="py-2.5">Assignee</th>
                  <th className="w-10 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const isSel = selected.has(t.id);
                  return (
                    <tr
                      key={t.id}
                      onClick={(e) => {
                        // ignore clicks on inputs/buttons/selects
                        const tag = (e.target as HTMLElement).tagName.toLowerCase();
                        if (["input", "button", "select", "label", "a"].includes(tag)) return;
                        setSelectedTaskId(t.id);
                      }}
                      className={cn(
                        "group cursor-pointer border-t border-border transition-colors",
                        isSel ? "bg-primary/[0.06]" : "hover:bg-muted/40",
                      )}
                    >
                      <td className={cn("px-3", rowPad)}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(t.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${t.id}`}
                          className="h-4 w-4 rounded border-input accent-[var(--color-primary)]"
                        />
                      </td>
                      <td className={cn("font-mono text-xs text-muted-foreground", rowPad)}>
                        #{t.id.slice(-6)}
                      </td>
                      <td className={cn("font-medium", rowPad)}>
                        <div className="line-clamp-1">{t.title}</div>
                      </td>
                      <td className={cn("hidden md:table-cell", rowPad)}>
                        <InlineStatusPicker
                          value={t.status}
                          onChange={(s) => updateStatus.mutate({ id: t.id, status: s })}
                        />
                      </td>
                      <td className={cn("hidden lg:table-cell", rowPad)}>
                        <Pill color={PRIORITY_META[t.priority].color} size="sm">
                          {PRIORITY_META[t.priority].label}
                        </Pill>
                      </td>
                      <td className={cn("hidden lg:table-cell", rowPad)}>
                        <div className="flex flex-wrap gap-1">
                          {t.labels.slice(0, 2).map((l) => (
                            <LabelChip key={l.name} tone={l.tone}>
                              {l.name}
                            </LabelChip>
                          ))}
                          {t.labels.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{t.labels.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={cn("hidden text-muted-foreground md:table-cell", rowPad)}>
                        {t.due
                          ? new Date(t.due).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className={rowPad}>
                        {t.assignee && (
                          <Avatar
                            initials={t.assignee.initials}
                            color={t.assignee.avatarColor}
                            size={22}
                          />
                        )}
                      </td>
                      <td
                        className={cn(
                          "pr-3 text-right opacity-0 transition-opacity group-hover:opacity-100",
                          rowPad,
                        )}
                      >
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label="More"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(t.id);
                          }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && tasks.length > 0 && (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-xs text-muted-foreground">
                      No tasks matching "{filter}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 animate-[var(--animate-rise-in)]">
          <div className="flex items-center gap-2 rounded-full border border-border glass-strong px-2 py-1.5 shadow-[var(--shadow-floating)]">
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {selected.size}
            </span>
            <span className="text-xs text-muted-foreground">selected</span>
            <span className="mx-1 h-4 w-px bg-border" />
            <select
              onChange={(e) => {
                const s = e.target.value as Status | "";
                if (s) bulkStatus.mutate(s);
                e.target.value = "";
              }}
              defaultValue=""
              className="rounded-md border border-input bg-card px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring/30"
              disabled={bulkStatus.isPending}
            >
              <option value="">Set status…</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                if (confirm(`Delete ${selected.size} task(s)?`)) bulkDelete.mutate();
              }}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setSelected(new Set())}
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <TaskDrawer
        task={selectedTask}
        projectIdOrSlug={projectId}
        open={!!selectedTaskId}
        onOpenChange={(o) => !o && setSelectedTaskId(null)}
      />
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: "updated" | "priority" | "status";
  onChange: (v: "updated" | "priority" | "status") => void;
}) {
  const [open, setOpen] = React.useState(false);
  const labels = {
    updated: "Recently updated",
    priority: "Priority",
    status: "Status",
  };
  return (
    <div className="relative">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen((v) => !v)}>
        Sort: {labels[value]} <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            {(["updated", "priority", "status"] as const).map((k) => (
              <button
                key={k}
                onClick={() => {
                  onChange(k);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                  value === k && "bg-accent/60",
                )}
              >
                {labels[k]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InlineStatusPicker({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center">
        <Pill color={STATUS_META[value].color} size="sm">
          {STATUS_META[value].label}
        </Pill>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                  value === s && "bg-accent/60",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: STATUS_META[s].color }}
                />
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
