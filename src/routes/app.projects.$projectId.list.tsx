import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { mockTasks, statusMeta, priorityMeta } from "@/lib/mock-data";
import { Pill, Avatar, LabelChip } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Filter, Plus, ChevronDown, MoreHorizontal, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId/list")({
  component: ListView,
});

function ListView() {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const allSelected = selected.size === mockTasks.length;
  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
          <Button variant="ghost" size="sm" className="gap-1.5">Sort: Updated <ChevronDown className="h-3.5 w-3.5" /></Button>
        </div>
        <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add task</Button>
      </div>

      <div className="overflow-hidden surface-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-14 z-10 bg-muted/60 backdrop-blur">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={(e) => setSelected(e.target.checked ? new Set(mockTasks.map(t => t.id)) : new Set())}
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
              {mockTasks.map(t => {
                const isSel = selected.has(t.id);
                return (
                  <tr key={t.id} className={`group border-t border-border transition-colors ${isSel ? "bg-primary/5" : "hover:bg-muted/40"}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(t.id)}
                        aria-label={`Select ${t.id}`}
                        className="h-4 w-4 rounded border-input accent-[var(--color-primary)]"
                      />
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="py-3 font-medium">{t.title}</td>
                    <td className="hidden py-3 md:table-cell">
                      <InlineSelect value={statusMeta[t.status].label} color={statusMeta[t.status].color} />
                    </td>
                    <td className="hidden py-3 lg:table-cell">
                      <InlineSelect value={priorityMeta[t.priority].label} color={priorityMeta[t.priority].color} />
                    </td>
                    <td className="hidden py-3 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {t.labels.map(l => <LabelChip key={l.name} tone={l.tone}>{l.name}</LabelChip>)}
                      </div>
                    </td>
                    <td className="hidden py-3 text-muted-foreground md:table-cell">{t.due ?? "—"}</td>
                    <td className="py-3"><Avatar initials={t.assignee.initials} color={t.assignee.color} /></td>
                    <td className="py-3 pr-3 text-right opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 animate-[var(--animate-scale-in)]">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-[var(--shadow-elevated)]">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <span className="h-4 w-px bg-border" />
            <Button size="sm" variant="ghost">Set status</Button>
            <Button size="sm" variant="ghost">Assign</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
            <span className="h-4 w-px bg-border" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(new Set())} aria-label="Clear selection"><X className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineSelect({ value, color }: { value: string; color: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted">
      <Pill color={color}>{value}</Pill>
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}
