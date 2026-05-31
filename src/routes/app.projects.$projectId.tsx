import * as React from "react";
import { createFileRoute, Outlet, Link, useRouterState, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectQuery, qk } from "@/lib/queries";
import { api, ApiError } from "@/lib/api";
import { safeEnsureQueryData } from "@/lib/safe-loader";
import { toast } from "sonner";
import {
  Plus,
  Star,
  Share2,
  MoreHorizontal,
  LayoutDashboard,
  Kanban,
  ListTodo,
  BookOpen,
  Code2,
  Pencil,
  Archive,
  Trash2,
  ExternalLink,
  CalendarDays,
} from "lucide-react";
import { Avatar } from "@/components/app/StatusBadge";
import { usePresence } from "@/lib/usePresence";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/projects/$projectId")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectId} — DevCollab` }],
  }),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(projectQuery(params.projectId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) throw notFound();
      await safeEnsureQueryData(context.queryClient, {
        queryKey: qk.project(params.projectId),
        queryFn: () => api.project(params.projectId),
        fallback: {
          project: {
            id: params.projectId,
            workspaceId: "",
            name: "Project",
            slug: params.projectId,
            description: "",
            color: "oklch(0.65 0.14 240)",
            createdAt: new Date().toISOString(),
          },
        },
      });
    }
  },
  component: ProjectLayout,
});

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(projectId));
  const project = data.project;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = { projectId };
  const resolvedBase = `/app/projects/${projectId}`;

  const tabs = [
    {
      to: "/app/projects/$projectId" as const,
      resolved: resolvedBase,
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      to: "/app/projects/$projectId/board" as const,
      resolved: `${resolvedBase}/board`,
      label: "Board",
      icon: Kanban,
    },
    {
      to: "/app/projects/$projectId/list" as const,
      resolved: `${resolvedBase}/list`,
      label: "List",
      icon: ListTodo,
    },
    {
      to: "/app/projects/$projectId/calendar" as const,
      resolved: `${resolvedBase}/calendar`,
      label: "Calendar",
      icon: CalendarDays,
    },
    {
      to: "/app/projects/$projectId/wiki" as const,
      resolved: `${resolvedBase}/wiki`,
      label: "Wiki",
      icon: BookOpen,
    },
    {
      to: "/app/projects/$projectId/snippets" as const,
      resolved: `${resolvedBase}/snippets`,
      label: "Snippets",
      icon: Code2,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: project.color }} />
            Project
          </span>
        }
        title={
          <span className="inline-flex items-center gap-3">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: project.color }}
            >
              {project.name[0]}
            </span>
            {project.name}
          </span>
        }
        description={project.description || "No description yet."}
        actions={
          <ProjectHeaderActions
            projectId={projectId}
            internalProjectId={project.id}
            projectName={project.name}
          />
        }
      >
        <AnimatedTabs tabs={tabs} pathname={pathname} params={params} />
      </PageHeader>
      <Outlet />
    </>
  );
}

type Tab = {
  to: `/app/projects/$projectId${string}`;
  resolved: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

function AnimatedTabs({
  tabs,
  pathname,
  params,
}: {
  tabs: Tab[];
  pathname: string;
  params: Record<string, string>;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const refs = React.useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = React.useState<{ left: number; width: number; show: boolean }>({
    left: 0,
    width: 0,
    show: false,
  });

  const activeKey = tabs.find((t) =>
    t.exact
      ? pathname === t.resolved
      : pathname === t.resolved || pathname.startsWith(t.resolved + "/"),
  )?.to;

  React.useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (!activeKey) {
      setIndicator({ left: 0, width: 0, show: false });
      return;
    }
    const el = refs.current[activeKey];
    if (!el) return;
    const cBox = containerRef.current.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setIndicator({
      left: box.left - cBox.left + containerRef.current.scrollLeft,
      width: box.width,
      show: true,
    });
  }, [activeKey, pathname]);

  return (
    <div ref={containerRef} className="relative -mx-2 flex items-center gap-0 overflow-x-auto px-2">
      {tabs.map((t) => {
        const active = activeKey === t.to;
        return (
          <Link
            key={t.to}
            ref={(el) => {
              refs.current[t.to] = el;
            }}
            to={t.to}
            params={params}
            className={cn(
              "group relative inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <t.icon
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            />
            {t.label}
          </Link>
        );
      })}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
        style={{
          left: indicator.left,
          width: indicator.width,
          opacity: indicator.show ? 1 : 0,
        }}
      />
    </div>
  );
}

function ProjectHeaderActions({
  projectId,
  internalProjectId,
  projectName,
}: {
  projectId: string;
  internalProjectId: string;
  projectName: string;
}) {
  const presence = usePresence(internalProjectId);
  const storageKey = `devcollab:project-fav:${projectId}`;
  const [favorited, setFavorited] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setFavorited(window.localStorage.getItem(storageKey) === "1");
    } catch {
      /* noop */
    }
  }, [storageKey]);

  function toggleFavorite() {
    setFavorited((prev) => {
      const next = !prev;
      try {
        if (next) window.localStorage.setItem(storageKey, "1");
        else window.localStorage.removeItem(storageKey);
      } catch {
        /* noop */
      }
      toast.success(next ? `${projectName} starred` : `${projectName} unstarred`);
      return next;
    });
  }

  function share() {
    const url = `${window.location.origin}/app/projects/${projectId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Project link copied"))
      .catch(() => toast.error("Couldn't copy link"));
  }

  function notImplemented(what: string) {
    toast.info(`${what} isn't available in this demo`);
  }

  const viewers = presence.data?.users ?? [];

  return (
    <>
      {viewers.length > 0 && (
        <div
          className="mr-2 hidden items-center -space-x-2 rounded-full border border-border bg-card/60 px-1.5 py-1 backdrop-blur sm:flex"
          title={`${viewers.length} viewing now: ${viewers.map((v) => v.name).join(", ")}`}
        >
          {viewers.slice(0, 4).map((v) => (
            <span
              key={v.id}
              className="ring-2 ring-background"
              title={`${v.name} is here`}
            >
              <Avatar initials={v.initials} color={v.color} size={22} />
            </span>
          ))}
          {viewers.length > 4 && (
            <span className="ml-2 inline-flex h-[22px] items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
              +{viewers.length - 4}
            </span>
          )}
          <span className="ml-2 inline-flex items-center gap-1 pl-1 text-[11px] text-muted-foreground">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            live
          </span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={favorited ? "Unstar project" : "Star project"}
        onClick={toggleFavorite}
        title={favorited ? "Unstar project" : "Star project"}
      >
        <Star
          className={cn("h-4 w-4 transition-colors", favorited ? "fill-warning text-warning" : "")}
        />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Share project"
        onClick={share}
        title="Copy project link"
      >
        <Share2 className="h-4 w-4" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More project actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>{projectName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => notImplemented("Rename project")}>
            <Pencil className="h-3.5 w-3.5" />
            <span>Rename project…</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={share}>
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Copy link</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => notImplemented("Archive project")}>
            <Archive className="h-3.5 w-3.5" />
            <span>Archive…</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => notImplemented("Delete project")}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete project…</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Link
        to="/app/projects/$projectId/board"
        params={{ projectId }}
        search={{ new: "1" } as never}
      >
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </Link>
    </>
  );
}
