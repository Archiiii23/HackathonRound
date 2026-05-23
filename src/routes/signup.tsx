import * as React from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AuthShell, OAuthRow, Divider, Field, PasswordField, Spinner, User, Mail } from "./login";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/queries";
import { toast } from "sonner";
import { ArrowRight, Check } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your workspace — DevCollab" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [strength, setStrength] = React.useState(0);
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});

  function calcStrength(p: string) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
    try {
      const { user } = await api.signup({ name, email, password });
      queryClient.setQueryData(qk.me, { user });
      await router.invalidate();
      toast.success(`Welcome to DevCollab, ${user.name.split(" ")[0]}!`);
      navigate({ to: "/app" });
    } catch (err) {
      setErrors({
        form:
          err instanceof ApiError
            ? err.message
            : "Could not create your account. Please try again.",
      });
      setLoading(false);
    }
  }

  async function useDemo() {
    setLoading(true);
    try {
      await api.bootstrap().catch(() => {});
      const { user } = await api.login({ email: "demo@devcollab.app", password: "devcollab123" });
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

  return (
    <AuthShell
      title="Create your workspace"
      sub="Start free. Invite your whole team in under a minute."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <OAuthRow onDemo={useDemo} disabled={loading} />
        <Divider />
        <Field
          label="Full name"
          name="name"
          icon={User}
          placeholder="Mira Chen"
          error={errors.name}
          onChange={() => setErrors((e) => ({ ...e, name: undefined, form: undefined }))}
        />
        <Field
          label="Work email"
          name="email"
          type="email"
          icon={Mail}
          placeholder="you@company.com"
          error={errors.email}
          onChange={() => setErrors((e) => ({ ...e, email: undefined, form: undefined }))}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            placeholder="At least 8 characters"
            error={errors.password}
            onChange={(e) => {
              setStrength(calcStrength(e.currentTarget.value));
              setErrors((er) => ({ ...er, password: undefined, form: undefined }));
            }}
          />
          {/* Strength meter */}
          <div className="mt-2 flex items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => {
              const active = i < strength;
              const color =
                strength <= 1
                  ? "bg-destructive"
                  : strength <= 2
                    ? "bg-warning"
                    : strength <= 3
                      ? "bg-info"
                      : "bg-success";
              return (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    active ? color : "bg-muted"
                  }`}
                />
              );
            })}
            <span className="ml-1 w-16 text-right text-[10px] text-muted-foreground">
              {strength <= 1
                ? "Weak"
                : strength === 2
                  ? "Okay"
                  : strength === 3
                    ? "Good"
                    : "Strong"}
            </span>
          </div>
        </div>
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
              Create workspace <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
        <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
          {[
            "Free for up to 5 teammates",
            "Includes AI Hub with GPT, Claude, Gemini",
            "No credit card required",
          ].map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-primary" />
              {b}
            </span>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-foreground hover:text-primary">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
