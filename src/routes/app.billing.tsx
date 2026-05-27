import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { billingQuery, qk } from "@/lib/queries";
import { api } from "@/lib/api";
import {
  CreditCard,
  Check,
  Sparkles,
  ArrowDown,
  Crown,
  Shield,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/billing")({
  component: BillingPage,
});

function BillingPage() {
  const billing = useQuery(billingQuery());
  const queryClient = useQueryClient();
  const [cardNumber, setCardNumber] = React.useState("4242 4242 4242 4242");
  const [cardCvc, setCardCvc] = React.useState("123");
  const [cardExp, setCardExp] = React.useState("12/30");

  const checkout = useMutation({
    mutationFn: (plan: "pro" | "free") =>
      api.checkout(plan, plan === "pro" ? { number: cardNumber.replace(/\s+/g, ""), cvc: cardCvc, exp: cardExp } : undefined),
    onSuccess: (res) => {
      toast.success(
        res.tier === "pro" ? `Upgraded to Pro · ${res.receiptId}` : "Switched to Free plan",
      );
      queryClient.invalidateQueries({ queryKey: qk.billing });
      queryClient.invalidateQueries({ queryKey: qk.workspaceSummary });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Checkout failed"),
  });

  const tier = billing.data?.tier ?? "free";
  const usage = billing.data?.usage ?? { projects: 0, members: 0 };
  const limits = billing.data?.limits ?? { projects: 3, members: 5 };

  return (
    <>
      <PageHeader
        eyebrow={<span>Account</span>}
        title="Billing & plans"
        description="Manage your workspace plan and billing — sandbox mode."
      />

      <main className="mx-auto w-full max-w-[1100px] space-y-8 px-6 py-8">
        {/* Current plan card */}
        <section
          className={cn(
            "surface-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between",
            tier === "pro" && "ring-2 ring-primary/40",
          )}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg",
                  tier === "pro"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {tier === "pro" ? <Crown className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
              </span>
              <div>
                <div className="font-display text-lg font-semibold capitalize">
                  {tier} plan
                </div>
                <div className="text-xs text-muted-foreground">
                  {tier === "pro"
                    ? "Unlimited projects, members, and AI usage."
                    : "Limited to 1 workspace, 3 projects, and 5 members."}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:max-w-md">
              <UsageBar
                label="Projects"
                value={usage.projects}
                limit={limits.projects}
              />
              <UsageBar
                label="Members"
                value={usage.members}
                limit={limits.members}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="text-2xl font-semibold">
              {tier === "pro" ? "$19" : "$0"}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </div>
            {tier === "pro" ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (confirm("Downgrade to the Free plan? Limits will reapply on your next mutation.")) {
                    checkout.mutate("free");
                  }
                }}
                disabled={checkout.isPending}
              >
                {checkout.isPending && checkout.variables === "free" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
                Downgrade
              </Button>
            ) : null}
          </div>
        </section>

        {/* Plan comparison */}
        <section>
          <div className="grid gap-4 md:grid-cols-2">
            <PlanCard
              name="Free"
              price="$0"
              tagline="For solo devs and tiny teams"
              features={[
                "1 workspace",
                "3 projects",
                "5 members",
                "Full task board, wiki, and snippets",
                "AI usage with daily limits",
              ]}
              cta={
                tier === "free" ? (
                  <Button variant="outline" size="sm" disabled className="w-full">
                    Current plan
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => checkout.mutate("free")}
                  >
                    Switch to Free
                  </Button>
                )
              }
              active={tier === "free"}
            />
            <PlanCard
              name="Pro"
              price="$19"
              tagline="For growing engineering teams"
              accent
              features={[
                "Unlimited workspaces",
                "Unlimited projects",
                "Unlimited members",
                "Unlimited AI usage",
                "Code Review + Task Breakdown AI",
                "Priority support",
              ]}
              cta={
                tier === "pro" ? (
                  <Button variant="outline" size="sm" disabled className="w-full">
                    You're on Pro
                  </Button>
                ) : (
                  <CheckoutButton
                    onSubmit={() => checkout.mutate("pro")}
                    pending={checkout.isPending && checkout.variables === "pro"}
                    cardNumber={cardNumber}
                    setCardNumber={setCardNumber}
                    cardCvc={cardCvc}
                    setCardCvc={setCardCvc}
                    cardExp={cardExp}
                    setCardExp={setCardExp}
                  />
                )
              }
            />
          </div>
        </section>

        {/* Trust strip */}
        <section className="surface-card flex items-center gap-3 p-4 text-xs text-muted-foreground">
          <Shield className="h-4 w-4 text-success" />
          <span>
            <strong className="text-foreground">Sandbox checkout.</strong> Card details aren't sent
            anywhere — they're validated client-side and we just flip your workspace tier in the DB.
          </span>
        </section>

        <div className="text-center text-xs text-muted-foreground">
          Looking for the public pricing page?{" "}
          <Link to="/pricing" className="text-primary hover:underline">
            View it here
          </Link>
          .
        </div>
      </main>
    </>
  );
}

function UsageBar({
  label,
  value,
  limit,
}: {
  label: string;
  value: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min(100, Math.round((value / Math.max(1, limit)) * 100)) : 0;
  const isLimited = limit !== null;
  const over = isLimited && value >= limit;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono", over && "text-destructive")}>
          {value}
          {isLimited ? ` / ${limit}` : " · unlimited"}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted">
        {isLimited ? (
          <div
            className={cn(
              "h-1.5 rounded-full transition-all",
              over ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-success" style={{ width: "100%" }} />
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  tagline,
  features,
  cta,
  accent,
  active,
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: React.ReactNode;
  accent?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-card flex flex-col p-6",
        accent && "bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] ring-1 ring-primary/30",
        active && "ring-2 ring-primary",
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-semibold">{name}</div>
          <div className="text-xs text-muted-foreground">{tagline}</div>
        </div>
        {accent && <Sparkles className="h-5 w-5 text-primary" />}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold">{price}</span>
        <span className="text-sm text-muted-foreground">/ month</span>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

function CheckoutButton({
  onSubmit,
  pending,
  cardNumber,
  setCardNumber,
  cardCvc,
  setCardCvc,
  cardExp,
  setCardExp,
}: {
  onSubmit: () => void;
  pending: boolean;
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
  cardExp: string;
  setCardExp: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button className="w-full gap-1.5" onClick={() => setOpen(true)}>
        <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
      </Button>
      {open && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-elevated)]"
          >
            <div className="border-b border-border bg-muted/20 px-5 py-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-success" />
                <div>
                  <div className="font-display text-base font-semibold">Sandbox checkout</div>
                  <div className="text-[11px] text-muted-foreground">
                    No real card is charged — this just flips your workspace tier.
                  </div>
                </div>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (cardNumber.replace(/\s+/g, "").length < 12) {
                  toast.error("Enter a card number (sandbox accepts any)");
                  return;
                }
                onSubmit();
                setOpen(false);
              }}
              className="space-y-3 p-5"
            >
              <label className="block text-xs">
                <span className="font-medium">Card number</span>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono focus:border-ring focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs">
                  <span className="font-medium">Expiry</span>
                  <input
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono focus:border-ring focus:outline-none"
                  />
                </label>
                <label className="block text-xs">
                  <span className="font-medium">CVC</span>
                  <input
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-mono focus:border-ring focus:outline-none"
                  />
                </label>
              </div>
              <Button type="submit" className="w-full gap-1.5" disabled={pending}>
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crown className="h-3.5 w-3.5" />}
                Pay $19/mo · Activate Pro
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                By upgrading you accept the demo Terms. Cancel anytime.
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
