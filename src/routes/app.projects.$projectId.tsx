import * as React from "react";
import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { mockProjects } from "@/lib/mock-data";
import { Plus, Star, Share2, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/projects/$projectId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} — DevCollab` }],
  }),
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const project = mockProjects.find((p) => p.id === projectId) ?? mockProjects[0];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = { projectId };
  const resolvedBase = `/app/projects/${projectId}`;

  const tabs = [
    { to: "/app/projects/$projectId" as const,            resolved: resolvedBase,                label: "Overview", exact: true },
    { to: "/app/projects/$projectId/board" as const,      resolved: `${resolvedBase}/board`,     label: "Board" },
    { to: "/app/projects/$projectId/list" as const,       resolved: `${resolvedBase}/list`,      label: "List" },
    { to: "/app/projects/$projectId/calendar" as const,   resolved: `${resolvedBase}/calendar`,  label: "Calendar", disabled: true },
    { to: "/app/projects/$projectId/wiki" as const,       resolved: `${resolvedBase}/wiki`,      label: "Wiki",     disabled: true },
    { to: "/app/projects/$projectId/snippets" as const,   resolved: `${resolvedBase}/snippets`,  label: "Snippets", disabled: true },
    { to: "/app/projects/$projectId/analytics" as const,  resolved: `${resolvedBase}/analytics`, label: "Analytics",disabled: true },
  ];

  return (
    <>
      <PageHeader
        eyebrow={<span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />Project</span>}
        title={project.name}
        description={project.description}
        actions={
          <>
            <Button variant="ghost" size="icon" aria-label="Favorite"><Star className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="Share"><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add task</Button>
          </>
        }
      >
        <div className="flex items-center gap-1 overflow-x-auto pb-0">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.resolved : pathname.startsWith(t.resolved);
            const borderCls = active ? "border-primary" : "border-transparent";
            const stateCls = t.disabled
              ? "cursor-not-allowed opacity-40"
              : active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground";
            const className = `tab-underline relative inline-flex h-10 items-center border-b-2 px-3 text-sm font-medium transition-colors ${borderCls} ${stateCls}`;
            if (t.disabled) {
              return <span key={t.to} className={className} data-active={active}>{t.label}</span>;
            }
            return (
              <Link key={t.to} to={t.to} params={params} className={className} data-active={active}>
                {t.label}
              </Link>
            );
          })}
        </div>
      </PageHeader>
      <Outlet />
    </>
  );
}
