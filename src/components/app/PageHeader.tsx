import * as React from "react";

export function PageHeader({
  title,
  description,
  actions,
  children,
  eyebrow,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex min-h-16 flex-col justify-center gap-4 py-4 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </div>
            )}
            <h1 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h1>
            {description && <p className="truncate text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
