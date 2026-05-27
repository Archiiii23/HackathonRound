import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/app/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const options = [
    { id: "light" as const, icon: Sun, label: "Light" },
    { id: "system" as const, icon: Monitor, label: "System" },
    { id: "dark" as const, icon: Moon, label: "Dark" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "relative inline-flex h-8 items-center rounded-full border border-border bg-card/70 p-0.5 backdrop-blur",
        className,
      )}
    >
      {options.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            onClick={() => setMode(opt.id)}
            className={cn(
              "relative z-10 inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors",
              active && "text-primary-foreground",
            )}
            title={opt.label}
            aria-label={opt.label}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {active && (
              <span className="absolute inset-0 -z-10 rounded-full bg-primary shadow-[var(--shadow-soft)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
