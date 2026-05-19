export function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
        color: `color-mix(in oklab, ${color} 70%, black)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

export function LabelChip({
  tone,
  children,
}: {
  tone: "green" | "blue" | "yellow" | "red" | "gray";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    green: "oklch(0.58 0.15 155)",
    blue: "oklch(0.62 0.14 240)",
    yellow: "oklch(0.78 0.14 80)",
    red: "oklch(0.6 0.22 27)",
    gray: "oklch(0.6 0.01 160)",
  };
  const color = map[tone];
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
        color: `color-mix(in oklab, ${color} 70%, black)`,
      }}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  color,
  size = 24,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-background"
      style={{ background: color, width: size, height: size }}
      title={initials}
    >
      {initials}
    </span>
  );
}
