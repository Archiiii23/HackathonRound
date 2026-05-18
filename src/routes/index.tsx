import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import {
  Sparkles, GitBranch, Kanban, Code2, BookOpen, Zap, Lock, Check, ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevCollab — One workspace for engineering teams" },
      { name: "description", content: "Plan, ship, and document together with AI. Kanban, wiki, snippets, and code review in one fast workspace." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <Hero />
      <LogoStrip />
      <Features />
      <ProductPreview />
      <Testimonials />
      <CtaBanner />
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="absolute inset-0 bg-radial-primary" aria-hidden />
      <div className="relative mx-auto max-w-[1280px] px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7 animate-[var(--animate-rise-in)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary">
                <span className="absolute inset-0 animate-[var(--animate-pulse-soft)] rounded-full" />
              </span>
              <span>v1.4 — AI Standup is live</span>
            </div>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              The workspace where <span className="text-gradient">engineering teams ship</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              DevCollab unifies your tasks, wiki, snippets, and code review — with AI that drafts standups, summarizes threads, and turns conversations into plans.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="h-11 px-5 shadow-[var(--shadow-glow)]">
                <Link to="/signup">Start free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-11 px-5">
                <a href="#features">See product tour</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Free for up to 5 teammates</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> SSO + SCIM on Business</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> SOC 2 Type II</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <HeroMock />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative animate-[var(--animate-scale-in)]">
      <div className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-primary/30 to-transparent blur-2xl" aria-hidden />
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-3 font-mono text-[11px] text-muted-foreground">devcollab.app / platform / board</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {[
            { label: "To do", color: "oklch(0.62 0.14 240)", n: 4 },
            { label: "In progress", color: "oklch(0.78 0.14 80)", n: 3 },
            { label: "Done", color: "oklch(0.58 0.15 155)", n: 5 },
          ].map((c, i) => (
            <div key={i} className="rounded-md border border-border bg-background p-2">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="text-muted-foreground">{c.n}</span>
              </div>
              <div className="space-y-2">
                {Array.from({ length: c.n > 3 ? 3 : c.n }).map((_, j) => (
                  <div key={j} className="rounded-md border border-border bg-card p-2 shadow-sm">
                    <div className="skeleton h-1.5 w-3/4" />
                    <div className="mt-2 flex items-center gap-1">
                      <div className="h-3 w-8 rounded bg-muted" />
                      <div className="h-3 w-10 rounded bg-muted" />
                      <div className="ml-auto h-4 w-4 rounded-full" style={{ background: "oklch(0.7 0.15 155)" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs">
              <span className="font-medium">AI summary:</span> 3 PRs ready, 2 blockers on auth, standup at 10:00.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoStrip() {
  const logos = ["Linear", "Vercel", "Datadog", "Postman", "Plaid", "Notion"];
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-8">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Trusted by engineering teams at</span>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          {logos.map((l) => (
            <span key={l} className="font-display text-sm font-semibold text-muted-foreground/80">{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Kanban, title: "Tasks that feel native", body: "Board, list, and calendar views sync in realtime. Drag-and-drop with snap, keyboard-first, and full filters." },
    { icon: BookOpen, title: "Living wiki", body: "Block-based editor with autosave and inline mentions. Pages stay current as your code evolves." },
    { icon: Code2, title: "Snippets and review", body: "Save runnable code with syntax-aware previews. Review PRs without leaving the workspace." },
    { icon: Sparkles, title: "AI that earns trust", body: "Drafts standups, summarizes threads, breaks down tickets. Always reversible, always cited." },
    { icon: GitBranch, title: "Git-aware", body: "Branches, PRs, and deploys appear on tasks automatically. No more context-switching." },
    { icon: Lock, title: "Enterprise ready", body: "SSO, SCIM, audit logs, and SOC 2 Type II — on every plan that needs it." },
  ];
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Everything you need</span>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">A single surface for the whole engineering loop.</h2>
          <p className="mt-3 text-muted-foreground">Stop stitching together five tools. DevCollab brings planning, docs, code, and AI into one fast workspace.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div key={i} className="surface-card surface-card-hover p-5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <it.icon className="h-4 w-4" />
              </div>
              <div className="mt-4 font-display text-base font-semibold">{it.title}</div>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="border-b border-border bg-muted/20">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-primary">AI Hub</span>
            <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight">An AI teammate that respects your workflow.</h3>
            <p className="mt-3 text-muted-foreground">Generate standups from yesterday's activity. Break down vague tickets into clear subtasks. Summarize long Slack-style threads. Always explicit, always reversible.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {["Standup digests from real activity", "Ticket breakdown with linked refs", "Code review with style profiles", "Thread summaries with citations"].map((x, i) => (
                <li key={i} className="flex items-start gap-2"><Zap className="mt-0.5 h-4 w-4 text-primary" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="surface-card overflow-hidden p-0">
            <div className="border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-mono text-muted-foreground">ai/standup.md</div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed">
{`# Standup — Tue, Jun 11
@mira: shipped SSO scaffolding; blocked on okta sandbox
@ari : refactor of drag-drop reducer at 80%, PR up tonight
@jules: drafting audit log export endpoint
@noa : reviewing presence race fix
@sam : wiki migration runbook ready for review

🟢 3 PRs merged   🟡 2 blockers   🔵 1 release at EOD`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { name: "Lena Park", role: "Eng Lead, Vercel", quote: "Replaced three tools in our first sprint. The AI standup alone saves us an hour a day." },
    { name: "Diego Alvarez", role: "Staff Eng, Plaid", quote: "Fast, opinionated, and finally a board that doesn't fight you on keyboard." },
    { name: "Ruth Imani", role: "CTO, Bandstand", quote: "Wiki + snippets + tasks in one place — our onboarding time dropped in half." },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <h3 className="font-display text-3xl font-semibold tracking-tight">Loved by teams that ship.</h3>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {quotes.map((q, i) => (
            <figure key={i} className="relative surface-card p-6">
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] p-px bg-gradient-to-br from-primary/30 via-transparent to-transparent [mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)] [mask-composite:exclude]" />
              <blockquote className="text-sm leading-relaxed">"{q.quote}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3 text-sm">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold">{q.name.split(" ").map(n => n[0]).join("")}</span>
                <span>
                  <div className="font-medium">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-radial-primary" aria-hidden />
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
        <div>
          <h3 className="font-display text-3xl font-semibold tracking-tight">Ship faster, together.</h3>
          <p className="mt-2 text-muted-foreground">Start free. Invite your whole team. No credit card.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="lg" asChild className="h-11 px-5 shadow-[var(--shadow-glow)]">
            <Link to="/signup">Get started <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-11 px-5">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
