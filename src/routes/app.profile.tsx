import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { meFullQuery, qk } from "@/lib/queries";
import { api } from "@/lib/api";
import {
  User,
  Github,
  Sparkles,
  Save,
  KeyRound,
  Camera,
  X,
  Loader2,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useQuery(meFullQuery());
  const queryClient = useQueryClient();
  const user = profile.data?.user;

  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [skillsInput, setSkillsInput] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>([]);
  const [githubUrl, setGithubUrl] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio);
    setSkills(user.skills);
    setGithubUrl(user.githubUrl);
    setAvatarUrl(user.avatarUrl ?? "");
  }, [user?.id, user?.name, user?.bio, user?.skills, user?.githubUrl, user?.avatarUrl, user]);

  const save = useMutation({
    mutationFn: () =>
      api.updateProfile({
        name,
        bio,
        skills,
        githubUrl,
        avatarUrl: avatarUrl.trim() || null,
      }),
    onSuccess: (res) => {
      toast.success("Profile saved");
      queryClient.setQueryData(qk.meFull, res);
      queryClient.invalidateQueries({ queryKey: qk.me });
      queryClient.invalidateQueries({ queryKey: qk.members });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't save profile"),
  });

  function addSkill() {
    const v = skillsInput.trim();
    if (!v) return;
    if (skills.includes(v)) {
      setSkillsInput("");
      return;
    }
    if (skills.length >= 20) {
      toast.info("Max 20 skills");
      return;
    }
    setSkills((s) => [...s, v]);
    setSkillsInput("");
  }

  function removeSkill(s: string) {
    setSkills((current) => current.filter((x) => x !== s));
  }

  if (!user) {
    return (
      <>
        <PageHeader title="Profile" />
        <main className="mx-auto w-full max-w-[820px] px-6 py-8">
          <div className="skeleton h-40 rounded-xl" />
        </main>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow={<span>Account</span>}
        title="Your profile"
        description="Update how teammates see you across the workspace."
        actions={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save changes
          </Button>
        }
      />

      <main className="mx-auto w-full max-w-[820px] space-y-6 px-6 py-8">
        <section className="surface-card p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                <span
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
                  style={{ background: user.avatarColor }}
                >
                  {user.initials}
                </span>
              )}
              <button
                onClick={() => {
                  const v = prompt("Avatar URL (leave blank to clear)", avatarUrl);
                  if (v !== null) setAvatarUrl(v.trim());
                }}
                className="absolute -bottom-1 -right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow hover:text-foreground"
                aria-label="Change avatar"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <Field label="Full name" icon={User}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
                />
              </Field>
              <div className="mt-3">
                <Field label="Email">
                  <input
                    value={user.email}
                    disabled
                    className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card p-6">
          <Field label="Short bio">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="A line or two about what you build and how you collaborate."
              className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
            />
          </Field>

          <div className="mt-5">
            <Field label="Skills" icon={Sparkles}>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-card p-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {s}
                    <button
                      onClick={() => removeSkill(s)}
                      className="text-primary/60 hover:text-primary"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSkill();
                    }
                    if (e.key === "Backspace" && !skillsInput && skills.length) {
                      setSkills((s) => s.slice(0, -1));
                    }
                  }}
                  placeholder={skills.length === 0 ? "TypeScript, React, Postgres…" : "Add skill"}
                  className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm focus:outline-none"
                />
              </div>
            </Field>
          </div>

          <div className="mt-5">
            <Field label="GitHub" icon={Github}>
              <input
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourhandle"
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
              />
            </Field>
          </div>
        </section>

        <ChangePasswordSection />

        <div className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/10 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3 w-3 text-success" />
            Changes are saved when you click Save.
          </span>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            <Save className="h-3.5 w-3.5" />
            Save changes
          </Button>
        </div>
      </main>
    </>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      {children}
    </label>
  );
}

function ChangePasswordSection() {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");

  const change = useMutation({
    mutationFn: () => api.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirmPw("");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't change password"),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("New password must be 8+ characters");
    if (next !== confirmPw) return toast.error("Passwords don't match");
    change.mutate();
  }

  return (
    <section className="surface-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-base font-semibold">Change password</h2>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="Current password"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
        />
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="New password"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
        />
        <input
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Confirm new password"
          className="rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none"
        />
        <div className="sm:col-span-3 flex justify-end">
          <Button type="submit" size="sm" disabled={change.isPending}>
            {change.isPending ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
