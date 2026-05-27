import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { meQuery, projectsQuery, searchQuery as searchQueryFactory } from "@/lib/queries";
import { useTheme } from "@/components/app/ThemeProvider";
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  Code2,
  ListTodo,
  Calendar,
  Plus,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Search,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queries";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  onOpenAiHub?: () => void;
  setOpenAiHub: (fn: () => void) => void;
};

const CommandPaletteContext = React.createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const aiHubRef = React.useRef<(() => void) | undefined>(undefined);
  const navigate = useNavigate();
  const projects = useQuery(projectsQuery());
  const firstSlug = projects.data?.projects[0]?.slug;
  const firstSlugRef = React.useRef<string | undefined>(firstSlug);
  React.useEffect(() => {
    firstSlugRef.current = firstSlug;
  }, [firstSlug]);

  const setOpenAiHub = React.useCallback((fn: () => void) => {
    aiHubRef.current = fn;
  }, []);

  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  // Chord handler for "G + letter" navigation shortcuts.
  // Tracks whether the previous keypress was "G" (within 1.2s) so a follow-up
  // letter such as "W"/"B"/"L" can act on it.
  React.useEffect(() => {
    let gPressedAt = 0;
    function isChordPrimed() {
      return Date.now() - gPressedAt < 1200;
    }

    const onKey = (e: KeyboardEvent) => {
      // Don't fire chords while typing or with modifier keys held.
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) {
        // Still handle the global ⌘K below.
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          toggle();
        }
        return;
      }

      const k = e.key.toLowerCase();

      if (k === "/" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Start of chord
      if (k === "g") {
        gPressedAt = Date.now();
        return;
      }

      // C — create task on first project
      if (k === "c" && !isChordPrimed() && !open) {
        const slug = firstSlugRef.current;
        if (!slug) return;
        e.preventDefault();
        navigate({
          to: "/app/projects/$projectId/board",
          params: { projectId: slug },
          search: { new: "1" } as never,
        });
        return;
      }

      // ?  — open palette (familiar muscle memory)
      if (k === "?" && !open) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      // Chord follow-ups
      if (isChordPrimed()) {
        const slug = firstSlugRef.current;
        if (k === "w") {
          e.preventDefault();
          gPressedAt = 0;
          navigate({ to: "/app" });
          return;
        }
        if (k === "b" && slug) {
          e.preventDefault();
          gPressedAt = 0;
          navigate({ to: "/app/projects/$projectId/board", params: { projectId: slug } });
          return;
        }
        if (k === "l" && slug) {
          e.preventDefault();
          gPressedAt = 0;
          navigate({ to: "/app/projects/$projectId/list", params: { projectId: slug } });
          return;
        }
        if (k === "p" && slug) {
          e.preventDefault();
          gPressedAt = 0;
          navigate({ to: "/app/projects/$projectId", params: { projectId: slug } });
          return;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, navigate, open]);

  const value = React.useMemo<Ctx>(
    () => ({
      open,
      setOpen,
      toggle,
      onOpenAiHub: () => aiHubRef.current?.(),
      setOpenAiHub,
    }),
    [open, toggle, setOpenAiHub],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPaletteDialog />
    </CommandPaletteContext.Provider>
  );
}

function isTypingTarget(t: EventTarget | null) {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (t.isContentEditable) return true;
  return false;
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

function CommandPaletteDialog() {
  const { open, setOpen, onOpenAiHub } = useCommandPalette();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projects = useQuery(projectsQuery());
  const me = useQuery(meQuery());
  const { setMode } = useTheme();

  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 160);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const search = useQuery(searchQueryFactory(debounced));

  function close() {
    setOpen(false);
  }

  function run(fn: () => void) {
    close();
    requestAnimationFrame(fn);
  }

  const projectsList = projects.data?.projects ?? [];
  const firstProject = projectsList[0];

  async function logout() {
    await api.logout().catch(() => {});
    queryClient.setQueryData(qk.me, { user: null });
    await router.invalidate();
    navigate({ to: "/login" });
    toast.success("Signed out");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-[640px] glass-strong shadow-[var(--shadow-floating)]"
        showCloseButton={false}
      >
        <Command
          className="bg-transparent [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
          filter={(value, search) => {
            if (!search) return 1;
            return value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Search or run a command…"
              className="h-9 border-0 bg-transparent p-0 text-[15px] focus:ring-0"
            />
            <span className="kbd">esc</span>
          </div>
          <CommandList className="max-h-[440px] py-1">
            {!debounced && (
              <>
                <CommandGroup heading="Navigation">
                  <CommandItem
                    value="workspace dashboard home"
                    onSelect={() => run(() => navigate({ to: "/app" }))}
                  >
                    <LayoutDashboard className="text-muted-foreground" />
                    <span>Workspace</span>
                    <CommandShortcut>G W</CommandShortcut>
                  </CommandItem>

                  {firstProject && (
                    <>
                      <CommandItem
                        value={`project ${firstProject.name} overview`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId",
                              params: { projectId: firstProject.slug },
                            }),
                          )
                        }
                      >
                        <FolderKanban className="text-muted-foreground" />
                        <span>Open project: {firstProject.name}</span>
                      </CommandItem>
                      <CommandItem
                        value={`board ${firstProject.name}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId/board",
                              params: { projectId: firstProject.slug },
                            }),
                          )
                        }
                      >
                        <Calendar className="text-muted-foreground" />
                        <span>Board view</span>
                        <CommandShortcut>G B</CommandShortcut>
                      </CommandItem>
                      <CommandItem
                        value={`list ${firstProject.name}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId/list",
                              params: { projectId: firstProject.slug },
                            }),
                          )
                        }
                      >
                        <ListTodo className="text-muted-foreground" />
                        <span>List view</span>
                        <CommandShortcut>G L</CommandShortcut>
                      </CommandItem>
                      <CommandItem
                        value={`wiki ${firstProject.name}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId/wiki",
                              params: { projectId: firstProject.slug },
                            }),
                          )
                        }
                      >
                        <BookOpen className="text-muted-foreground" />
                        <span>Wiki</span>
                      </CommandItem>
                      <CommandItem
                        value={`snippets ${firstProject.name}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId/snippets",
                              params: { projectId: firstProject.slug },
                            }),
                          )
                        }
                      >
                        <Code2 className="text-muted-foreground" />
                        <span>Snippets</span>
                      </CommandItem>
                    </>
                  )}
                </CommandGroup>

                {projectsList.length > 1 && (
                  <CommandGroup heading="Projects">
                    {projectsList.slice(0, 6).map((p) => (
                      <CommandItem
                        key={p.id}
                        value={`project ${p.name} ${p.description}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId",
                              params: { projectId: p.slug },
                            }),
                          )
                        }
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: p.color }}
                        />
                        <span>{p.name}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{p.slug}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem value="ai hub assistant" onSelect={() => run(() => onOpenAiHub?.())}>
                    <Sparkles className="text-primary" />
                    <span>Open AI Hub</span>
                    <CommandShortcut>⌘ J</CommandShortcut>
                  </CommandItem>
                  {firstProject && (
                    <CommandItem
                      value="new task create"
                      onSelect={() =>
                        run(() =>
                          navigate({
                            to: "/app/projects/$projectId/board",
                            params: { projectId: firstProject.slug },
                            search: { new: "1" } as never,
                          }),
                        )
                      }
                    >
                      <Plus />
                      <span>Create task</span>
                      <CommandShortcut>C</CommandShortcut>
                    </CommandItem>
                  )}
                </CommandGroup>

                <CommandSeparator />
                <CommandGroup heading="Preferences">
                  <CommandItem value="light theme" onSelect={() => run(() => setMode("light"))}>
                    <Sun />
                    <span>Switch to light theme</span>
                  </CommandItem>
                  <CommandItem value="dark theme" onSelect={() => run(() => setMode("dark"))}>
                    <Moon />
                    <span>Switch to dark theme</span>
                  </CommandItem>
                  <CommandItem value="system theme" onSelect={() => run(() => setMode("system"))}>
                    <Monitor />
                    <span>Use system theme</span>
                  </CommandItem>
                </CommandGroup>

                {me.data?.user && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Account">
                      <CommandItem value="logout sign out" onSelect={() => run(() => logout())}>
                        <LogOut className="text-destructive" />
                        <span className="text-destructive">Log out</span>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}

            {debounced && (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 py-6">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">No results for "{debounced}"</div>
                  </div>
                </CommandEmpty>

                {search.data?.tasks && search.data.tasks.length > 0 && (
                  <CommandGroup heading="Tasks">
                    {search.data.tasks.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={`task ${t.title} ${t.id}`}
                        onSelect={() =>
                          run(() =>
                            navigate({
                              to: "/app/projects/$projectId/list",
                              params: { projectId: t.projectSlug },
                            }),
                          )
                        }
                      >
                        <ListTodo className="text-muted-foreground" />
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto text-[10px] uppercase text-muted-foreground">
                          {t.status.replace("_", " ")}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {search.data?.wiki && search.data.wiki.length > 0 && (
                  <CommandGroup heading="Wiki Pages">
                    {search.data.wiki.map((w) => {
                      const slug = projectsList.find((p) => p.id === w.projectId)?.slug;
                      return (
                        <CommandItem
                          key={w.id}
                          value={`wiki ${w.title} ${w.preview}`}
                          onSelect={() => {
                            if (!slug) return;
                            run(() =>
                              navigate({
                                to: "/app/projects/$projectId/wiki",
                                params: { projectId: slug },
                              }),
                            );
                          }}
                        >
                          <BookOpen className="text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{w.title}</div>
                            <div className="truncate text-[10px] text-muted-foreground">
                              {w.preview}…
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {search.data?.snippets && search.data.snippets.length > 0 && (
                  <CommandGroup heading="Snippets">
                    {search.data.snippets.map((s) => {
                      const slug = projectsList.find((p) => p.id === s.projectId)?.slug;
                      return (
                        <CommandItem
                          key={s.id}
                          value={`snippet ${s.title} ${s.description} ${s.language}`}
                          onSelect={() => {
                            if (!slug) return;
                            run(() =>
                              navigate({
                                to: "/app/projects/$projectId/snippets",
                                params: { projectId: slug },
                              }),
                            );
                          }}
                        >
                          <Code2 className="text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{s.title}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">
                              {s.language}
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="kbd">↑↓</span> navigate
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="kbd">↵</span> select
              </span>
            </div>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> DevCollab
            </span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
