export function Pill({
  color,
  children,
  size = "md",
}: {
  color: string;
  children: React.ReactNode;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 16%, transparent)`,
        color: color,
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
        backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)`,
        color: color,
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

export function AvatarStack({
  members,
  max = 4,
  size = 22,
}: {
  members: { initials: string; color: string }[];
  max?: number;
  size?: number;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((m, i) => (
        <Avatar key={i} initials={m.initials} color={m.color} size={size} />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
