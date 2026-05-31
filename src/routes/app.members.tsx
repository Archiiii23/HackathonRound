import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/EmptyState";
import { InviteDialog } from "@/components/app/AppPanels";
import { invitesQuery, membersQuery, meQuery, qk } from "@/lib/queries";
import { api, formatRelative, type Role } from "@/lib/api";
import {
  Users,
  UserPlus,
  Crown,
  ShieldCheck,
  User as UserIcon,
  Eye,
  X,
  Mail,
  Copy,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/members")({
  component: MembersPage,
});

const ROLE_INFO: Record<Role, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { label: "Owner", icon: Crown },
  admin: { label: "Admin", icon: ShieldCheck },
  member: { label: "Member", icon: UserIcon },
  viewer: { label: "Viewer", icon: Eye },
};

function MembersPage() {
  const members = useQuery(membersQuery());
  const invites = useQuery(invitesQuery());
  const me = useQuery(meQuery());
  const [showInvite, setShowInvite] = React.useState(false);
  const queryClient = useQueryClient();

  const myRole = members.data?.members.find((m) => m.id === me.data?.user?.id)?.role ?? null;
  const canManage = myRole === "owner" || myRole === "admin";

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api.updateMemberRole(userId, role),
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: qk.members });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update role"),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => api.removeMember(userId),
    onSuccess: () => {
      toast.success("Member removed");
      queryClient.invalidateQueries({ queryKey: qk.members });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove member"),
  });

  const deleteInvite = useMutation({
    mutationFn: (id: string) => api.deleteInvite(id),
    onSuccess: () => {
      toast.success("Invite revoked");
      queryClient.invalidateQueries({ queryKey: qk.invites });
    },
  });

  const list = members.data?.members ?? [];
  const pending = (invites.data?.invites ?? []).filter((i) => !i.acceptedAt);

  return (
    <>
      <PageHeader
        eyebrow={<span>Workspace</span>}
        title="Members & roles"
        description="Manage who can access this workspace and what they can do."
        actions={
          canManage && (
            <Button size="sm" className="gap-1.5" onClick={() => setShowInvite(true)}>
              <UserPlus className="h-3.5 w-3.5" /> Invite people
            </Button>
          )
        }
      />

      <main className="mx-auto w-full max-w-[1100px] space-y-8 px-6 py-8">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-base font-semibold">
              {list.length} member{list.length === 1 ? "" : "s"}
            </h2>
          </div>

          {members.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No members yet"
              description="Invite teammates to start collaborating."
              action={
                <Button size="sm" onClick={() => setShowInvite(true)}>
                  Invite people
                </Button>
              }
            />
          ) : (
            <ul className="surface-card divide-y divide-border/60 p-0">
              {list.map((m) => {
                const role = m.role in ROLE_INFO ? m.role : "member";
                const Icon = ROLE_INFO[role].icon;
                const isSelf = m.id === me.data?.user?.id;
                const skills = m.skills ?? [];
                return (
                  <li key={m.id} className="flex items-center gap-3 p-4">
                    <Avatar initials={m.initials} color={m.avatarColor} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.name}</span>
                        {isSelf && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            You
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                      {skills.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {skills.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="chip border border-border bg-muted/30 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="hidden text-right text-[11px] text-muted-foreground sm:block">
                      Joined {formatRelative(m.joinedAt)}
                    </div>
                    <RoleSelect
                      value={role}
                      disabled={!canManage || role === "owner" || isSelf}
                      onChange={(nextRole) => updateRole.mutate({ userId: m.id, role: nextRole })}
                    />
                    {canManage && !isSelf && role !== "owner" && (
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${m.name} from this workspace?`)) remove.mutate(m.id);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Remove member"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {!canManage && (
                      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        <Icon className="h-3 w-3" /> {ROLE_INFO[role].label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {pending.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-base font-semibold">
                Pending invites — {pending.length}
              </h2>
            </div>
            <ul className="surface-card divide-y divide-border/60 p-0">
              {pending.map((inv) => (
                <li key={inv.id} className="flex items-center gap-3 p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{inv.email}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Invited as {inv.role} · expires {formatRelative(inv.expiresAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/signup?invite=${encodeURIComponent(inv.token)}`;
                      navigator.clipboard
                        .writeText(link)
                        .then(() => toast.success("Invite link copied"))
                        .catch(() => toast.error("Couldn't copy"));
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-muted/40"
                  >
                    <Copy className="h-3 w-3" /> Link
                  </button>
                  {canManage && (
                    <button
                      onClick={() => {
                        if (confirm(`Revoke invite for ${inv.email}?`)) deleteInvite.mutate(inv.id);
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Revoke invite"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="surface-card p-4 text-sm">
            <div className="mb-2 font-display text-base font-semibold">Role permissions</div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Owner</span> — full control + billing
                + workspace deletion.
              </li>
              <li>
                <span className="font-medium text-foreground">Admin</span> — manage members, roles,
                billing, projects.
              </li>
              <li>
                <span className="font-medium text-foreground">Member</span> — view & edit all
                content; create projects, tasks, wiki, snippets.
              </li>
              <li>
                <span className="font-medium text-foreground">Viewer</span> — read-only access to
                everything.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <InviteDialog open={showInvite} onOpenChange={setShowInvite} />
    </>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const Icon = ROLE_INFO[value].icon;
  const choices: Role[] = ["admin", "member", "viewer"];
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs",
          disabled ? "cursor-default text-muted-foreground" : "hover:bg-muted/40",
        )}
      >
        <Icon className="h-3 w-3" />
        <span>{ROLE_INFO[value].label}</span>
        {!disabled && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-border bg-popover p-1 shadow-[var(--shadow-elevated)]">
            {choices.map((r) => {
              const RIcon = ROLE_INFO[r].icon;
              return (
                <button
                  key={r}
                  onClick={() => {
                    onChange(r);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-accent",
                    value === r && "bg-accent/60",
                  )}
                >
                  <RIcon className="h-3 w-3" />
                  {ROLE_INFO[r].label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
