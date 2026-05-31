import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Pill, LabelChip, Avatar } from "@/components/app/StatusBadge";
import {
  api,
  PRIORITY_META,
  STATUS_META,
  type Priority,
  type Status,
  type TaskRow,
} from "@/lib/api";
import { commentsQuery, membersQuery, qk } from "@/lib/queries";
import {
  CalendarDays,
  Trash2,
  Sparkles,
  Hash,
  CornerDownLeft,
  Loader2,
  Check,
  Send,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskDrawer({
  task,
  projectIdOrSlug,
  open,
  onOpenChange,
}: {
  task: TaskRow | null;
  projectIdOrSlug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState(task?.title ?? "");
  const [description, setDescription] = React.useState(task?.description ?? "");
  const [dirty, setDirty] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDirty(false);
    setAiResult(null);
    setSavedAt(null);
  }, [task?.id]);

  const tasksKey = qk.tasks(projectIdOrSlug);

  const update = useMutation({
    mutationFn: (input: Partial<TaskRow> & { assigneeId?: string | null }) =>
      api.updateTask(task!.id, input as never),
    onMutate: async (input) => {
      if (!task) return;
      await queryClient.cancelQueries({ queryKey: tasksKey });
      const prev = queryClient.getQueryData<{ tasks: TaskRow[] }>(tasksKey);
      queryClient.setQueryData<{ tasks: TaskRow[] }>(tasksKey, (old) =>
        old
          ? {
              tasks: old.tasks.map((t) =>
                t.id === task.id ? { ...t, ...(input as Partial<TaskRow>) } : t,
              ),
            }
          : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(tasksKey, ctx.prev);
      toast.error("Couldn't update task");
    },
    onSuccess: () => {
      setSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: qk.activity });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteTask(task!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      toast.success("Task deleted");
      onOpenChange(false);
    },
    onError: () => toast.error("Couldn't delete task"),
  });

  React.useEffect(() => {
    if (!dirty || !task) return;
    const t = setTimeout(() => {
      update.mutate({ title, description });
      setDirty(false);
    }, 700);
    return () => clearTimeout(t);
  }, [dirty, title, description, task, update]);

  async function summarizeWithAI() {
    if (!task) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.ai({
        kind: "summary",
        prompt: `${title}\n\n${description}`,
        context: `Task ${task.id} in project ${projectIdOrSlug}, status ${task.status}, priority ${task.priority}`,
      });
      setAiResult(res.output);
    } catch {
      toast.error("AI summary failed");
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiToDescription() {
    if (!aiResult) return;
    setDescription((d) => (d ? `${d}\n\n— AI summary —\n${aiResult}` : aiResult));
    setDirty(true);
    toast.success("AI summary appended");
  }

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="space-y-0 border-b border-border p-5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="sr-only">{task.title}</SheetTitle>
            <div className="flex items-center gap-2">
              <span className="chip">
                <Hash className="h-3 w-3" /> {task.id.slice(-6)}
              </span>
              <StatusPicker value={task.status} onChange={(s) => update.mutate({ status: s })} />
              <PriorityPicker
                value={task.priority}
                onChange={(p) => update.mutate({ priority: p })}
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {update.isPending && (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving
                </span>
              )}
              {!update.isPending && savedAt && (
                <span className="inline-flex items-center gap-1 text-success">
                  <Check className="h-3 w-3" /> Saved
                </span>
              )}
            </div>
          </div>

          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="Task title…"
            className="mt-3 w-full border-0 bg-transparent p-0 font-display text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/70"
          />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-3 gap-x-4 gap-y-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
            <DetailRow label="Assignee">
              {task.assignee ? (
                <span className="inline-flex items-center gap-2">
                  <Avatar
                    initials={task.assignee.initials}
                    color={task.assignee.avatarColor}
                    size={18}
                  />
                  <span className="text-foreground">{task.assignee.name}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </DetailRow>
            <DetailRow label="Due">
              {task.due ? (
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                  {new Date(task.due).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </DetailRow>
            <DetailRow label="Created">
              <span className="text-foreground">
                {new Date(task.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </DetailRow>
          </div>

          {(task.labels ?? []).length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Labels
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(task.labels ?? []).map((l) => (
                  <LabelChip key={l.name} tone={l.tone}>
                    {l.name}
                  </LabelChip>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={summarizeWithAI}
                disabled={aiLoading || (!title && !description)}
                className="h-7 gap-1.5 text-xs text-primary"
              >
                {aiLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Summarize with AI
              </Button>
            </div>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDirty(true);
              }}
              placeholder="Add more context, acceptance criteria, links…"
              rows={9}
              className="mt-2 w-full resize-none rounded-lg border border-input bg-background p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            />

            {aiResult && (
              <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs animate-[var(--animate-rise-in)]">
                <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-primary">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI summary
                  </span>
                  <button
                    onClick={applyAiToDescription}
                    className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-primary hover:bg-primary/10"
                  >
                    Append <CornerDownLeft className="h-3 w-3" />
                  </button>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{aiResult}</div>
              </div>
            )}
          </div>

          <AssigneeRow
            task={task}
            onChange={(assigneeId) => update.mutate({ assigneeId } as never)}
          />

          <CommentsThread taskId={task.id} />
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/30 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Delete this task?")) remove.mutate();
            }}
            className="gap-1.5 text-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
          <div className="text-[11px] text-muted-foreground">
            Press <span className="kbd">Esc</span> to close
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate">{children}</div>
    </div>
  );
}

function StatusPicker({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  const [open, setOpen] = React.useState(false);
  const meta = STATUS_META[value];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center">
        <Pill color={meta.color}>{meta.label}</Pill>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            {(Object.keys(STATUS_META) as Status[]).map((s) => (
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
                {value === s && <Check className="ml-auto h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AssigneeRow({
  task,
  onChange,
}: {
  task: TaskRow;
  onChange: (assigneeId: string | null) => void;
}) {
  const members = useQuery(membersQuery());
  const [open, setOpen] = React.useState(false);
  const choices = members.data?.members ?? [];
  return (
    <div className="mt-5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Assignee
      </div>
      <div className="relative mt-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm hover:bg-muted/40"
        >
          {task.assignee ? (
            <>
              <Avatar
                initials={task.assignee.initials}
                color={task.assignee.avatarColor}
                size={22}
              />
              <span className="truncate">{task.assignee.name}</span>
            </>
          ) : (
            <>
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                ?
              </span>
              <span className="text-muted-foreground">Unassigned</span>
            </>
          )}
          <span className="ml-auto text-[11px] text-muted-foreground">change</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
              <button
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
              >
                Unassign
              </button>
              {choices.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                    task.assignee?.id === m.id && "bg-accent/60",
                  )}
                >
                  <Avatar initials={m.initials} color={m.avatarColor} size={20} />
                  <span className="truncate">{m.name}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                    {m.role}
                  </span>
                  {task.assignee?.id === m.id && <Check className="ml-1 h-3 w-3 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CommentsThread({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  const comments = useQuery(commentsQuery(taskId));
  const members = useQuery(membersQuery());
  const [draft, setDraft] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [mentionState, setMentionState] = React.useState<{ start: number; query: string } | null>(
    null,
  );

  const create = useMutation({
    mutationFn: (content: string) => api.createComment(taskId, content),
    onSuccess: () => {
      setDraft("");
      setMentionState(null);
      queryClient.invalidateQueries({ queryKey: qk.comments(taskId) });
      queryClient.invalidateQueries({ queryKey: qk.activity });
      queryClient.invalidateQueries({ queryKey: qk.notifications });
    },
    onError: () => toast.error("Couldn't post comment"),
  });

  function onDraftChange(value: string) {
    setDraft(value);
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    // Find the start of the current @mention (after whitespace or start).
    let i = cursor - 1;
    while (i >= 0 && /[A-Za-z0-9_.-]/.test(value[i])) i--;
    if (i >= 0 && value[i] === "@" && (i === 0 || /\s/.test(value[i - 1]))) {
      setMentionState({ start: i, query: value.slice(i + 1, cursor).toLowerCase() });
    } else {
      setMentionState(null);
    }
  }

  function applyMention(handle: string) {
    if (!mentionState) return;
    const before = draft.slice(0, mentionState.start);
    const after = draft.slice(mentionState.start + 1 + mentionState.query.length);
    const next = `${before}@${handle} ${after}`;
    setDraft(next);
    setMentionState(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  const mentionCandidates = React.useMemo(() => {
    if (!mentionState) return [];
    const q = mentionState.query.toLowerCase();
    return (members.data?.members ?? [])
      .map((m) => {
        const local = m.email.split("@")[0].toLowerCase();
        const slug = m.name.toLowerCase().replace(/[^a-z0-9_.-]+/g, "");
        return { ...m, handle: local || slug };
      })
      .filter(
        (m) =>
          !q ||
          m.handle.includes(q) ||
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [mentionState, members.data]);

  return (
    <div className="mt-6">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        Comments
      </div>

      <div className="mt-3 space-y-3">
        {comments.isLoading ? (
          <>
            <div className="skeleton h-16 rounded-lg" />
            <div className="skeleton h-16 rounded-lg" />
          </>
        ) : (comments.data?.comments ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No comments yet — be the first to say something.
          </div>
        ) : (
          (comments.data?.comments ?? []).map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar initials={c.author.initials} color={c.author.avatarColor} size={28} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 text-xs">
                  <span className="font-medium text-foreground">{c.author.name}</span>
                  <span className="text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {renderWithMentions(c.content)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim() || create.isPending) return;
          create.mutate(draft.trim());
        }}
        className="relative mt-4"
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              if (draft.trim()) create.mutate(draft.trim());
            }
            if (e.key === "Escape" && mentionState) {
              e.preventDefault();
              setMentionState(null);
            }
          }}
          placeholder="Add a comment… try @mentioning a teammate"
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <AtSign className="h-3 w-3" /> Type @ to mention
            <span className="kbd ml-2">⌘↵</span>
            <span>to send</span>
          </span>
          <Button type="submit" size="sm" className="gap-1.5" disabled={!draft.trim() || create.isPending}>
            {create.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Send
          </Button>
        </div>

        {mentionState && mentionCandidates.length > 0 && (
          <div className="absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            {mentionCandidates.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => applyMention(m.handle)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                <Avatar initials={m.initials} color={m.avatarColor} size={20} />
                <span className="truncate font-medium">{m.name}</span>
                <span className="truncate text-muted-foreground">@{m.handle}</span>
              </button>
            ))}
          </div>
        )}
      </form>

    </div>
  );
}

function renderWithMentions(text: string): React.ReactNode {
  // Highlight @mentions inline.
  const out: React.ReactNode[] = [];
  let last = 0;
  const re = /@([A-Za-z0-9_.-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span
        key={`${m.index}-${m[1]}`}
        className="rounded bg-primary/10 px-1 py-0.5 font-medium text-primary"
      >
        @{m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  const [open, setOpen] = React.useState(false);
  const meta = PRIORITY_META[value];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center">
        <Pill color={meta.color}>{meta.label}</Pill>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)] animate-[var(--animate-scale-in)]">
            {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                  value === p && "bg-accent/60",
                )}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: PRIORITY_META[p].color }}
                />
                {PRIORITY_META[p].label}
                {value === p && <Check className="ml-auto h-3 w-3 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
