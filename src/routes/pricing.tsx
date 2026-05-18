import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — DevCollab" },
      { name: "description", content: "Simple, predictable pricing for teams of every size. Start free, upgrade when you're ready." },
    ],
  }),
  component: PricingPage,
});

const plans = [
  {
    name: "Free",
    price: "$0",
    sub: "for small teams getting started",
    features: ["Up to 5 teammates", "Unlimited tasks & wiki pages", "Basic AI (50 runs/mo)", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    sub: "per user / month, billed yearly",
    features: ["Unlimited members", "Unlimited AI runs", "Snippets + code review", "Roadmap & analytics", "Priority support"],
    cta: "Start 14-day trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$24",
    sub: "per user / month, billed yearly",
    features: ["SSO + SCIM", "Audit logs & SOC 2 reports", "Custom roles & permissions", "Advanced AI policies", "Dedicated CSM"],
    cta: "Contact sales",
    highlight: false,
  },
];

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-grid bg-grid-fade" aria-hidden />
        <div className="relative mx-auto max-w-[1280px] px-6 py-20 text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-primary">Pricing</span>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">Simple plans. No surprises.</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Start free. Upgrade when your team grows. Cancel anytime.</p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={
                  "relative flex flex-col rounded-xl border bg-card p-6 transition-shadow " +
                  (p.highlight
                    ? "border-primary/40 bg-primary/[0.03] shadow-[var(--shadow-glow)]"
                    : "border-border surface-card-hover")
                }
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-6 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="font-display text-lg font-semibold">{p.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-semibold tracking-tight">{p.price}</span>
                  {p.price !== "$0" && <span className="text-sm text-muted-foreground">/ user / mo</span>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{p.sub}</div>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-primary" /> <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex justify-end">
                  <Button asChild variant={p.highlight ? "default" : "outline"} className="gap-1.5">
                    <Link to="/signup">{p.cta} <ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h3 className="font-display text-xl font-semibold tracking-tight">Frequently asked</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[
                ["Can I switch plans later?", "Yes. Upgrade or downgrade anytime — we prorate by the day."],
                ["Do you offer a non-profit discount?", "We offer 50% off for verified non-profits and OSS maintainers."],
                ["Is there a free trial of Pro?", "Yes — 14 days, no credit card required."],
                ["Where is data hosted?", "US and EU regions, with full data residency on Business."],
              ].map(([q, a]) => (
                <div key={q} className="surface-card p-5">
                  <div className="font-medium">{q}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
