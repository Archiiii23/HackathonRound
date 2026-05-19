import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — DevCollab" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});

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

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate(e.currentTarget)) return;
    setLoading(true);
    setTimeout(() => navigate({ to: "/app" }), 700);
  }

  return (
    <AuthShell title="Welcome back" sub="Log in to your DevCollab workspace.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <OAuthRow />
        <Divider />
        <Field
          label="Email"
          name="email"
          type="email"
          placeholder="you@company.com"
          error={errors.email}
          onChange={() => setErrors((e) => ({ ...e, email: undefined }))}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          error={errors.password}
          onChange={() => setErrors((e) => ({ ...e, password: undefined }))}
          rightLabel={
            <a href="#" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </a>
          }
        />
        <div className="flex items-center justify-between pt-2">
          <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground">
            Create account
          </Link>
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? <Spinner /> : "Log in"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="absolute inset-0 bg-radial-primary" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Logo />
        <div className="my-auto animate-[var(--animate-rise-in)]">
          <div className="surface-card p-7 shadow-[var(--shadow-elevated)]">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <a href="#" className="underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="underline">
              Privacy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export function OAuthRow() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" className="gap-2">
        <GoogleIcon /> Google
      </Button>
      <Button type="button" variant="outline" className="gap-2">
        <GithubIcon /> GitHub
      </Button>
    </div>
  );
}

export function Divider() {
  return (
    <div className="relative my-1 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
      <span className="relative z-10 bg-card px-2">or with email</span>
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
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  rightLabel?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        {rightLabel}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        aria-invalid={!!error}
        className={
          "mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 " +
          (error ? "border-destructive" : "border-input focus:border-ring")
        }
      />
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
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
