import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { LegalDialog, type LegalDocKey } from "@/components/app/AppPanels";
import {
  Sparkles,
  GitBranch,
  Kanban,
  Code2,
  BookOpen,
  Zap,
  Lock,
  Check,
  ArrowRight,
  Star,
  Workflow,
  Wand2,
  Layers,
  PlayCircle,
  Github,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DevCollab — One workspace for engineering teams" },
      {
        name: "description",
        content:
          "Plan, ship, and document together with AI. Kanban, wiki, snippets, and code review in one fast workspace.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [doc, setDoc] = React.useState<LegalDocKey | null>(null);
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <Hero onShowChangelog={() => setDoc("changelog")} />
      <LogoStrip />
      <Features />
      <ProductPreview />
      <Workflow1 />
      <Testimonials />
      <Pricing />
      <CtaBanner />
      <MarketingFooter />
      <LegalDialog doc={doc} onOpenChange={(v) => !v && setDoc(null)} />
    </div>
  );
}

function Hero({ onShowChangelog }: { onShowChangelog: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora opacity-30" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-[0.3]" aria-hidden />

      <div className="relative mx-auto max-w-[1280px] px-6 py-20 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7 animate-[var(--animate-rise-in)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary">
                <span className="absolute inset-0 animate-[var(--animate-pulse-soft)] rounded-full" />
              </span>
              <span>v1.4 — AI Standup is live</span>
              <span className="text-border">|</span>
              <button
                onClick={onShowChangelog}
                className="font-semibold text-primary hover:underline"
              >
                Read changelog →
              </button>
            </div>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-[68px]">
              The workspace where <br className="hidden md:block" />
              <span className="text-gradient">engineering teams ship</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              DevCollab unifies tasks, wiki, snippets, and code review — with AI that drafts
              standups, summarizes threads, and turns conversations into plans.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild className="h-12 px-6 text-base shadow-[var(--shadow-glow)]">
                <Link to="/signup">
                  Start free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 gap-2 px-5 text-base">
                <a href="#preview">
                  <PlayCircle className="h-4 w-4" />
                  Watch the tour
                </a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> Free for up to 5 teammates
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> SSO + SCIM on Business
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> SOC 2 Type II
              </span>
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
      <div
        className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-primary/30 via-info/20 to-transparent blur-2xl"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-floating)] ring-gradient">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-3 font-mono text-[11px] text-muted-foreground">
            devcollab.app / platform / board
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success" /> live
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {[
            {
              label: "To do",
              color: "oklch(0.62 0.14 240)",
              tasks: ["SSO login flow", "Audit log export", "Drag-drop refactor"],
            },
            {
              label: "In progress",
              color: "oklch(0.78 0.14 80)",
              tasks: ["Presence race fix", "Wiki autosave"],
            },
            {
              label: "Done",
              color: "oklch(0.58 0.15 155)",
              tasks: ["Onboarding tour", "PR comments", "Search ranking", "Mobile nav"],
            },
          ].map((c, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-background/80 p-2"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.color }} />
                  {c.label}
                </span>
                <span className="text-muted-foreground">{c.tasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {c.tasks.slice(0, 3).map((t, j) => (
                  <div
                    key={j}
                    className="rounded-md border border-border bg-card p-2 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <div className="truncate text-[10px] font-medium">{t}</div>
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="h-3 w-7 rounded bg-muted" />
                      <div
                        className="ml-auto h-3.5 w-3.5 rounded-full ring-2 ring-card"
                        style={{ background: `oklch(0.7 0.15 ${i * 80 + j * 40})` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2.5">
            <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="absolute inset-0 rounded-md animate-[var(--animate-pulse-soft)]" />
            </span>
            <span className="text-xs">
              <span className="font-medium">AI summary:</span> 3 PRs ready, 2 blockers on auth,
              standup at 10:00.
            </span>
          </div>
        </div>
      </div>

      {/* Floating chips around the mock */}
      <div className="absolute -left-4 top-1/3 hidden -translate-y-1/2 rotate-[-6deg] animate-[var(--animate-float)] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[var(--shadow-elevated)] md:block">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> PR #428 merged
        </span>
      </div>
      <div
        className="absolute -right-4 bottom-1/4 hidden rotate-[5deg] animate-[var(--animate-float)] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-[var(--shadow-elevated)] md:block"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" /> Standup ready
        </span>
      </div>
    </div>
  );
}

function LogoStrip() {
  const logos = ["Linear", "Vercel", "Datadog", "Postman", "Plaid", "Notion"];
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-8">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Trusted by engineering teams at
        </span>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
          {logos.map((l, i) => (
            <span
              key={l}
              className="font-display text-sm font-semibold text-muted-foreground/80 transition-colors hover:text-foreground"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: Kanban,
      title: "Tasks that feel native",
      body: "Board, list, and calendar views sync in realtime. Drag-and-drop with snap, keyboard-first, and full filters.",
      tone: "oklch(0.58 0.15 155)",
    },
    {
      icon: BookOpen,
      title: "Living wiki",
      body: "Block-based editor with autosave and inline mentions. Pages stay current as your code evolves.",
      tone: "oklch(0.62 0.14 240)",
    },
    {
      icon: Code2,
      title: "Snippets and review",
      body: "Save runnable code with syntax-aware previews. Review PRs without leaving the workspace.",
      tone: "oklch(0.65 0.16 320)",
    },
    {
      icon: Sparkles,
      title: "AI that earns trust",
      body: "Drafts standups, summarizes threads, breaks down tickets. Always reversible, always cited.",
      tone: "oklch(0.78 0.14 80)",
    },
    {
      icon: Github,
      title: "Native GitHub Sync",
      body: "Bi-directional sync for Issues and Pull Requests. PRs and deploys appear on tasks automatically. No more context-switching.",
      tone: "oklch(0.65 0.1 270)",
    },
    {
      icon: Lock,
      title: "Enterprise ready",
      body: "SSO, SCIM, audit logs, and SOC 2 Type II — on every plan that needs it.",
      tone: "oklch(0.6 0.22 27)",
    },
  ];
  return (
    <section id="features" className="border-b border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="max-w-2xl">
          <span className="chip tone-info">
            <Layers className="h-3 w-3" /> Everything you need
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            A single surface for the whole engineering loop.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Stop stitching together five tools. DevCollab brings planning, docs, code, and AI into
            one fast workspace.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <div
              key={i}
              className="surface-card surface-card-hover group relative overflow-hidden p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: it.tone }}
              />
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  background: `color-mix(in oklab, ${it.tone} 14%, transparent)`,
                  color: it.tone,
                }}
              >
                <it.icon className="h-4.5 w-4.5" />
              </div>
              <div className="mt-4 font-display text-base font-semibold">{it.title}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section id="preview" className="relative overflow-hidden border-b border-border bg-muted/20">
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-50" aria-hidden />
      <div className="relative mx-auto max-w-[1280px] px-6 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <span className="chip tone-warning">
              <Wand2 className="h-3 w-3" /> AI Hub
            </span>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              An AI teammate that respects your workflow.
            </h3>
            <p className="mt-3 text-muted-foreground">
              Generate standups from yesterday's activity. Break down vague tickets into clear
              subtasks. Summarize long Slack-style threads. Always explicit, always reversible.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Standup digests from real activity",
                "Ticket breakdown with linked refs",
                "Code review with style profiles",
                "Thread summaries with citations",
              ].map((x, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-2">
              <Button asChild className="gap-1.5">
                <Link to="/signup">
                  Try AI Hub <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-2xl bg-gradient-to-br from-warning/20 via-primary/20 to-info/20 blur-2xl"
              aria-hidden
            />
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-floating)]">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">ai/standup.md</span>
                </div>
                <span className="chip tone-success">OpenAI · gpt-4o</span>
              </div>
              <pre className="overflow-x-auto bg-card p-5 font-mono text-[12.5px] leading-relaxed">
                {`# Standup — Tue, Jun 11
@mira: shipped SSO scaffolding; blocked on okta sandbox
@ari : refactor of drag-drop reducer at 80%, PR up tonight
@jules: drafting audit log export endpoint
@noa : reviewing presence race fix
@sam : wiki migration runbook ready for review

🟢 3 PRs merged   🟡 2 blockers   🔵 1 release at EOD`}
              </pre>
              <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
                <span className="kbd">⌘</span>
                <span className="kbd">↵</span>
                <span>Re-run</span>
                <span className="ml-auto inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-[var(--animate-pulse-soft)]" />
                  Generated 2 seconds ago
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Workflow1() {
  const steps = [
    {
      kicker: "01",
      title: "Plan with intent",
      body: "Drop a ticket idea, let AI break it into subtasks with clear acceptance criteria.",
    },
    {
      kicker: "02",
      title: "Build in flow",
      body: "Keyboard-first board, snippets, and wiki — no context switching for 15-minute tasks.",
    },
    {
      kicker: "03",
      title: "Ship with proof",
      body: "Auto-link PRs and deploys to tasks. Every decision is searchable forever.",
    },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="chip tone-info">
              <Workflow className="h-3 w-3" /> Workflow
            </span>
            <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Designed around how engineers actually ship.
            </h3>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Most tools optimize for managers. DevCollab is built around the build → review → ship
            loop where you and your teammates actually live.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="surface-card surface-card-hover relative overflow-hidden p-6">
              <div className="absolute -top-6 right-4 font-display text-7xl font-bold text-primary/5">
                {s.kicker}
              </div>
              <div className="relative">
                <div className="font-mono text-[11px] font-semibold tracking-wider text-primary">
                  STEP {s.kicker}
                </div>
                <h4 className="mt-2 font-display text-xl font-semibold">{s.title}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Lena Park",
      role: "Eng Lead, Vercel",
      quote:
        "Replaced three tools in our first sprint. The AI standup alone saves us an hour a day.",
      tone: "oklch(0.58 0.15 155)",
    },
    {
      name: "Diego Alvarez",
      role: "Staff Eng, Plaid",
      quote: "Fast, opinionated, and finally a board that doesn't fight you on keyboard.",
      tone: "oklch(0.62 0.14 240)",
    },
    {
      name: "Ruth Imani",
      role: "CTO, Bandstand",
      quote: "Wiki + snippets + tasks in one place — our onboarding time dropped in half.",
      tone: "oklch(0.65 0.16 320)",
    },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="max-w-2xl">
          <span className="chip">
            <Star className="h-3 w-3 fill-warning text-warning" /> Loved by teams that ship
          </span>
          <h3 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            From your first commit to your hundredth deploy.
          </h3>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="surface-card surface-card-hover relative overflow-hidden p-6"
            >
              <div className="flex items-center gap-0.5 text-warning">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 fill-warning" />
                ))}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed">"{q.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 text-sm">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: q.tone }}
                >
                  {q.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
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

function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      sub: "Forever, up to 5 teammates",
      bullets: ["3 active projects", "Wiki + snippets", "Basic AI", "Community support"],
    },
    {
      name: "Team",
      price: "$12",
      sub: "per seat / month",
      bullets: [
        "Unlimited projects",
        "Full AI Hub (GPT, Claude, Gemini)",
        "Realtime presence",
        "Priority support",
      ],
      featured: true,
    },
    {
      name: "Business",
      price: "$28",
      sub: "per seat / month",
      bullets: ["SSO + SCIM", "Audit logs", "Custom AI guardrails", "SOC 2 Type II"],
    },
  ];
  return (
    <section className="border-b border-border bg-muted/20">
      <div className="mx-auto max-w-[1280px] px-6 py-20">
        <div className="text-center">
          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Simple, fair pricing.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start free. Upgrade when you outgrow it. Cancel any time.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-3">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-xl border ${
                p.featured
                  ? "border-primary/40 bg-card shadow-[var(--shadow-glow)]"
                  : "border-border bg-card"
              } p-6`}
            >
              {p.featured && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </span>
              )}
              <div className="text-sm font-medium">{p.name}</div>
              <div className="mt-2 flex items-end gap-1">
                <span className="font-display text-4xl font-semibold">{p.price}</span>
                <span className="pb-1 text-xs text-muted-foreground">
                  /{p.sub.split(" ")[1] || "mo"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{p.sub}</div>
              <ul className="mt-5 space-y-2 text-sm">
                {p.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 text-primary" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button asChild variant={p.featured ? "default" : "outline"} className="mt-6 w-full">
                <Link to="/signup">Start with {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="aurora opacity-25" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
      <div className="relative mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-6 py-20 md:flex-row md:items-center">
        <div>
          <h3 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Ship faster, together.
          </h3>
          <p className="mt-2 text-muted-foreground">
            Start free. Invite your whole team. No credit card.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="lg"
            asChild
            className="h-12 gap-1.5 px-6 text-base shadow-[var(--shadow-glow)]"
          >
            <Link to="/signup">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="h-12 px-5 text-base">
            <Link to="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
