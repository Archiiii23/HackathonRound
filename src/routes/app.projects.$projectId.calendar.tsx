import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { tasksQuery } from "@/lib/queries";
import { PRIORITY_META, STATUS_META, type TaskRow } from "@/lib/api";
import { Avatar } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId/calendar")({
  component: CalendarView,
});

function CalendarView() {
  const { projectId } = Route.useParams();
  const tasksQ = useQuery(tasksQuery(projectId));
  const [cursor, setCursor] = React.useState<Date>(() => startOfMonth(new Date()));

  const grid = React.useMemo(() => buildCalendarGrid(cursor), [cursor]);
  const tasks = tasksQ.data?.tasks ?? [];

  // Index tasks by YYYY-MM-DD of due date.
  const byDay = React.useMemo(() => {
    const m = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      if (!t.due) continue;
      const key = dayKey(new Date(t.due));
      const arr = m.get(key) ?? [];
      arr.push(t);
      m.set(key, arr);
    }
    return m;
  }, [tasks]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const today = new Date();
  const todayKey = dayKey(today);

  const undated = tasks.filter((t) => !t.due);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-6 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/40"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCursor(startOfMonth(new Date()))}
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/40"
            >
              Today
            </button>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/40"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {tasks.filter((t) => t.due).length} dated · {undated.length} undated
        </div>
      </header>

      {tasksQ.isLoading ? (
        <div className="skeleton h-[480px] rounded-xl" />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No tasks yet"
          description="Tasks with a due date will show up on this calendar."
          action={
            <Link
              to="/app/projects/$projectId/board"
              params={{ projectId }}
              search={{ new: "1" }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5" /> New task
            </Link>
          }
        />
      ) : (
        <>
          <div className="surface-card overflow-hidden p-0">
            <div className="grid grid-cols-7 border-b border-border bg-muted/30 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="px-3 py-2">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {grid.map((day) => {
                const key = dayKey(day.date);
                const dayTasks = byDay.get(key) ?? [];
                const isToday = key === todayKey;
                const isOtherMonth = day.date.getMonth() !== cursor.getMonth();
                return (
                  <div
                    key={key + (isOtherMonth ? "o" : "")}
                    className={cn(
                      "min-h-[110px] border-b border-r border-border/60 p-2 last:border-r-0",
                      isOtherMonth && "bg-muted/20",
                    )}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex h-6 min-w-[24px] items-center justify-center rounded-full text-[11px] font-medium",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isOtherMonth
                              ? "text-muted-foreground/70"
                              : "text-foreground",
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <Link
                          key={t.id}
                          to="/app/projects/$projectId/board"
                          params={{ projectId }}
                          search={{ task: t.id }}
                          className="group flex items-center gap-1.5 truncate rounded border border-border bg-card px-1.5 py-0.5 text-[11px] hover:bg-muted/40"
                        >
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: PRIORITY_META[t.priority].color }}
                          />
                          <span className="truncate group-hover:text-foreground">{t.title}</span>
                          <span
                            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full opacity-70"
                            style={{ background: STATUS_META[t.status].color }}
                          />
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {undated.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                No due date · {undated.length}
              </h3>
              <ul className="surface-card divide-y divide-border/60 p-0">
                {undated.slice(0, 8).map((t) => (
                  <li key={t.id} className="flex items-center gap-3 p-3 text-sm">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: PRIORITY_META[t.priority].color }}
                    />
                    <Link
                      to="/app/projects/$projectId/board"
                      params={{ projectId }}
                      search={{ task: t.id }}
                      className="flex-1 truncate hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span
                      className="rounded bg-muted px-1.5 py-0.5 text-[11px] capitalize"
                      style={{ color: STATUS_META[t.status].color }}
                    >
                      {STATUS_META[t.status].label}
                    </span>
                    {t.assignee && (
                      <Avatar
                        initials={t.assignee.initials}
                        color={t.assignee.avatarColor}
                        size={20}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

// ----- date helpers (Mon-start, no deps) -----
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function buildCalendarGrid(cursor: Date) {
  const first = startOfMonth(cursor);
  // Monday = 0
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: { date: Date }[] = [];
  for (let i = startDow; i > 0; i--) {
    cells.push({ date: new Date(first.getFullYear(), first.getMonth(), 1 - i) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(first.getFullYear(), first.getMonth(), d) });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1) });
  }
  // Pad to at least 6 weeks for layout stability.
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1) });
  }
  return cells;
}
