import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { API_BASE, api, ApiError } from "@/lib/api";
import { DEMO_ACCOUNT, PRO_ACCOUNT } from "@/lib/accounts";
import { qk } from "@/lib/queries";
import { toast } from "sonner";
import { LegalDialog, type LegalDocKey } from "@/components/app/AppPanels";
import { Sparkles, Eye, EyeOff, Lock, Mail, User, Check, ArrowRight, Quote } from "lucide-react";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — DevCollab" }] }),
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = Route.useSearch();
  const [loading, setLoading] = React.useState(false);
  const [legalDoc, setLegalDoc] = React.useState<LegalDocKey | null>(null);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string; form?: string }>(
    {},
  );

  function validate(form: HTMLFormElement) {
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
    if (password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate(e.currentTarget)) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    setLoading(true);
    setErrors({});
    try {
      const { user } = await api.login({ email, password });
      queryClient.setQueryData(qk.me, { user });
      await router.invalidate();
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const dest = search.next && search.next.startsWith("/") ? search.next : "/app";
      navigate({ to: dest });
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "Could not sign you in. Please try again.",
      });
      setLoading(false);
    }
  }

  async function useDemo() {
    setLoading(true);
    setErrors({});
    try {
      await api.bootstrap().catch(() => {});
      const { user } = await api.login({
        email: DEMO_ACCOUNT.email,
        password: DEMO_ACCOUNT.password,
      });
      queryClient.setQueryData(qk.me, { user });
      await router.invalidate();
      toast.success("Demo workspace loaded");
      navigate({ to: "/app" });
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "Demo sign-in failed.",
      });
      setLoading(false);
    }
  }

  async function usePro() {
    setLoading(true);
    setErrors({});
    try {
      await api.bootstrap().catch(() => {});
      const { user } = await api.login({
        email: PRO_ACCOUNT.email,
        password: PRO_ACCOUNT.password,
      });
      queryClient.setQueryData(qk.me, { user });
      await router.invalidate();
      toast.success("Pro workspace loaded — unlimited projects & members");
      navigate({ to: "/app" });
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "Pro sign-in failed.",
      });
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      sub="Log in to your DevCollab workspace."
      onShowLegal={(d) => setLegalDoc(d)}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <OAuthRow onDemo={useDemo} disabled={loading} />
        <Divider />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          icon={Mail}
          error={errors.email}
          onChange={() => setErrors((e) => ({ ...e, email: undefined, form: undefined }))}
        />
        <PasswordField
          label="Password"
          name="password"
          error={errors.password}
          onChange={() => setErrors((e) => ({ ...e, password: undefined, form: undefined }))}
          rightLabel={
            <button
              type="button"
              onClick={() => setLegalDoc("forgot")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot?
            </button>
          }
        />
        {errors.form && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive animate-[var(--animate-rise-in)]">
            {errors.form}
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full gap-1.5">
          {loading ? (
            <Spinner />
          ) : (
            <>
              Log in <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
        <button
          type="button"
          onClick={usePro}
          disabled={loading}
          className="w-full rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-xs text-foreground transition-colors hover:border-primary/60 hover:bg-primary/15 disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Pro workspace —{" "}
            <span className="font-mono">{PRO_ACCOUNT.email}</span>
            <span className="text-muted-foreground">· password</span>{" "}
            <span className="font-mono">{PRO_ACCOUNT.password}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={useDemo}
          disabled={loading}
          className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/[0.03] px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            Try the demo workspace —{" "}
            <span className="font-mono text-foreground">{DEMO_ACCOUNT.email}</span>
          </span>
        </button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-medium text-foreground hover:text-primary">
            Create your account
          </Link>
        </p>
      </form>
      <LegalDialog doc={legalDoc} onOpenChange={(v) => !v && setLegalDoc(null)} />
    </AuthShell>
  );
}

export function AuthShell({
  title,
  sub,
  children,
  onShowLegal,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
  onShowLegal?: (doc: LegalDocKey) => void;
}) {
  // Fallback dialog state if the caller doesn't manage one.
  const [internalDoc, setInternalDoc] = React.useState<LegalDocKey | null>(null);
  const open = onShowLegal ?? setInternalDoc;

  return (
    <div className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1fr_minmax(0,560px)]">
      <ArtworkPanel />
      <div className="relative flex min-h-screen flex-col px-6 py-8 lg:px-12">
        <div className="flex items-center justify-between">
          <Logo to="/" />
          <Link
            to="/signup"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Need an account?{" "}
            <span className="font-medium text-foreground hover:text-primary">Sign up</span>
          </Link>
        </div>
        <div className="my-auto w-full max-w-md self-center animate-[var(--animate-rise-in)]">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
          </div>
          {children}
          <p className="mt-8 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our{" "}
            <button
              type="button"
              onClick={() => open("terms")}
              className="underline-offset-2 hover:underline"
            >
              Terms
            </button>{" "}
            &{" "}
            <button
              type="button"
              onClick={() => open("privacy")}
              className="underline-offset-2 hover:underline"
            >
              Privacy Policy
            </button>
          </p>
        </div>
      </div>
      {!onShowLegal && (
        <LegalDialog doc={internalDoc} onOpenChange={(v) => !v && setInternalDoc(null)} />
      )}
    </div>
  );
}

function ArtworkPanel() {
  return (
    <div className="relative hidden overflow-hidden border-r border-border bg-card lg:block">
      <div className="absolute inset-0 bg-mesh" aria-hidden />
      <div className="absolute inset-0 bg-noise opacity-[0.4]" aria-hidden />
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora opacity-50" />
      </div>

      <div className="relative flex h-full flex-col justify-between p-12">
        <div className="flex items-center gap-2 text-sm">
          <span className="chip glass-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-[var(--animate-pulse-soft)]" />
            All systems normal
          </span>
        </div>

        <FloatingMock />

        <figure className="max-w-md text-foreground">
          <Quote className="h-6 w-6 text-primary/70" />
          <blockquote className="mt-3 font-display text-xl font-semibold leading-tight tracking-tight">
            "DevCollab replaced three tools in our first sprint. The AI standup alone saves us an
            hour a day."
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3 text-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              LP
            </span>
            <span>
              <div className="font-medium">Lena Park</div>
              <div className="text-xs text-muted-foreground">Eng Lead, Vercel</div>
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

function FloatingMock() {
  return (
    <div className="relative mx-auto w-full max-w-md animate-[var(--animate-rocket)]">
      <div
        className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/30 via-info/20 to-transparent blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-[var(--shadow-floating)] backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
          <span className="font-mono text-[10px] text-muted-foreground">devcollab.app</span>
          <span className="chip tone-info text-[9px]">⌘K Search</span>
        </div>
        <div className="space-y-2 p-3">
          {[
            { name: "SSO login flow", status: "In progress", tone: "oklch(0.78 0.14 80)" },
            { name: "Audit log export", status: "In review", tone: "oklch(0.65 0.1 290)" },
            { name: "Drag-drop refactor", status: "Done", tone: "oklch(0.58 0.15 155)" },
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border bg-background/70 p-2.5 backdrop-blur-sm"
            >
              <span className="h-2 w-2 rounded-full" style={{ background: t.tone }} />
              <span className="flex-1 text-xs font-medium">{t.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `color-mix(in oklab, ${t.tone} 14%, transparent)`,
                  color: t.tone,
                }}
              >
                {t.status}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs">
              <span className="font-medium">AI:</span> 3 PRs ready, standup at 10:00.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OAuthRow({ onDemo, disabled }: { onDemo?: () => void; disabled?: boolean }) {
  function handleGoogle() {
    // Browser navigates to the backend, which redirects to Google, which
    // redirects back to /api/auth/google/callback, which sets the session
    // cookie and finally redirects to /app.
    const returnTo = encodeURIComponent(
      typeof window !== "undefined" ? window.location.pathname.replace(/^\/login\/?$/, "") || "/app" : "/app",
    );
    window.location.href = `${API_BASE}/auth/google/start?returnTo=${returnTo}`;
  }

  function handleClick(provider: string) {
    if (onDemo) {
      toast.info(`${provider} sign-in not configured — using the demo workspace`);
      onDemo();
      return;
    }
    toast.info(`${provider} sign-in not configured in this demo`);
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 text-sm"
        onClick={handleGoogle}
        disabled={disabled}
      >
        <GoogleIcon /> Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 gap-2 text-sm"
        onClick={() => handleClick("GitHub")}
        disabled={disabled}
      >
        <GithubIcon /> GitHub
      </Button>
    </div>
  );
}

export function Divider() {
  return (
    <div className="relative my-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <span className="relative z-10 bg-background px-3">or continue with email</span>
      <span className="absolute inset-x-0 top-1/2 -z-0 h-px bg-border" />
    </div>
  );
}

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  rightLabel,
  onChange,
  icon: Icon,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  rightLabel?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  icon?: React.ComponentType<{ className?: string }>;
  defaultValue?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-xs font-medium">
          {label}
        </label>
        {rightLabel}
      </div>
      <div className="relative mt-1.5">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          onChange={onChange}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          className={
            "h-11 w-full rounded-lg border bg-card px-3 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 " +
            (Icon ? "pl-9 " : "") +
            (error ? "border-destructive" : "border-input focus:border-ring")
          }
        />
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-destructive animate-[var(--animate-rise-in)]">
          <span className="h-1 w-1 rounded-full bg-destructive" />
          {error}
        </div>
      )}
    </div>
  );
}

export function PasswordField({
  label,
  name,
  error,
  rightLabel,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  error?: string;
  rightLabel?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-xs font-medium">
          {label}
        </label>
        {rightLabel}
      </div>
      <div className="relative mt-1.5">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          onChange={onChange}
          aria-invalid={!!error}
          className={
            "h-11 w-full rounded-lg border bg-card pl-9 pr-10 text-sm transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 " +
            (error ? "border-destructive" : "border-input focus:border-ring")
          }
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-destructive animate-[var(--animate-rise-in)]">
          <span className="h-1 w-1 rounded-full bg-destructive" />
          {error}
        </div>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export { User, Mail, Check };

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 11.6v3.4h4.7c-.2 1.2-1.5 3.4-4.7 3.4-2.8 0-5.1-2.3-5.1-5.2S9.2 8 12 8c1.6 0 2.7.7 3.3 1.2l2.3-2.2C16.2 5.7 14.3 5 12 5c-4.4 0-8 3.6-8 8s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.8 0-.5-.1-.9-.1-1.6H12z"
      />
    </svg>
  );
}
function GithubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.6.5.5 5.6.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2.2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.3 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.3 2.8.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.6 18.4.5 12 .5z" />
    </svg>
  );
}
