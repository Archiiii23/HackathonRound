import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/Logo";
import { LegalDialog, type LegalDocKey } from "@/components/app/AppPanels";

type FooterLink =
  | { kind: "to"; href: string; label: string }
  | { kind: "anchor"; href: string; label: string }
  | { kind: "doc"; doc: LegalDocKey; label: string }
  | { kind: "external"; href: string; label: string };

const PRODUCT: FooterLink[] = [
  { kind: "anchor", href: "/#features", label: "Features" },
  { kind: "to", href: "/pricing", label: "Pricing" },
  { kind: "doc", doc: "changelog", label: "Changelog" },
];

const COMPANY: FooterLink[] = [
  { kind: "doc", doc: "about", label: "About" },
  { kind: "doc", doc: "careers", label: "Careers" },
  { kind: "doc", doc: "contact", label: "Contact" },
];

const LEGAL: FooterLink[] = [
  { kind: "doc", doc: "privacy", label: "Privacy" },
  { kind: "doc", doc: "terms", label: "Terms" },
  { kind: "doc", doc: "security", label: "Security" },
];

export function MarketingFooter() {
  const [doc, setDoc] = React.useState<LegalDocKey | null>(null);

  function renderLink(l: FooterLink) {
    if (l.kind === "to") {
      return (
        <Link to={l.href} className="hover:text-foreground">
          {l.label}
        </Link>
      );
    }
    if (l.kind === "anchor") {
      return (
        <a href={l.href} className="hover:text-foreground">
          {l.label}
        </a>
      );
    }
    if (l.kind === "external") {
      return (
        <a href={l.href} target="_blank" rel="noreferrer" className="hover:text-foreground">
          {l.label}
        </a>
      );
    }
    return (
      <button
        onClick={() => setDoc(l.doc)}
        className="text-left transition-colors hover:text-foreground"
      >
        {l.label}
      </button>
    );
  }

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <Logo />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              The AI-powered workspace for engineering teams. Plan, ship, and document together.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8 text-sm">
            <FooterColumn title="Product" items={PRODUCT} render={renderLink} />
            <FooterColumn title="Company" items={COMPANY} render={renderLink} />
            <FooterColumn title="Legal" items={LEGAL} render={renderLink} />
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} DevCollab, Inc.</span>
          <span className="font-mono">v1.0.0 · all systems normal</span>
        </div>
      </div>
      <LegalDialog doc={doc} onOpenChange={(v) => !v && setDoc(null)} />
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  render,
}: {
  title: string;
  items: FooterLink[];
  render: (l: FooterLink) => React.ReactNode;
}) {
  return (
    <div>
      <div className="font-medium text-foreground">{title}</div>
      <ul className="mt-3 space-y-2 text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>{render(i)}</li>
        ))}
      </ul>
    </div>
  );
}
