import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthShell, OAuthRow, Divider, Field, Spinner } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your workspace — DevCollab" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; password?: string }>(
    {},
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "");
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => navigate({ to: "/app" }), 700);
  }

  return (
    <AuthShell
      title="Create your workspace"
      sub="Start free. Invite your whole team in under a minute."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <OAuthRow />
        <Divider />
        <Field
          label="Full name"
          name="name"
          placeholder="Mira Chen"
          error={errors.name}
          onChange={() => setErrors((e) => ({ ...e, name: undefined }))}
        />
        <Field
          label="Work email"
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
          placeholder="At least 8 characters"
          error={errors.password}
          onChange={() => setErrors((e) => ({ ...e, password: undefined }))}
        />
        <div className="flex items-center justify-between pt-2">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already have an account?
          </Link>
          <Button type="submit" disabled={loading} className="min-w-[140px]">
            {loading ? <Spinner /> : "Create workspace"}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
