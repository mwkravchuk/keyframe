import type { ReactNode } from "react";

type StatusBadgeTone = "neutral" | "accent" | "info" | "success" | "warning" | "destructive";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

const TONE_CLASS: Record<StatusBadgeTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  accent: "border-accent/25 bg-accent/10 text-foreground",
  info: "border-sky-400/35 bg-sky-400/14 text-sky-700 dark:text-sky-300",
  success: "border-emerald-400/35 bg-emerald-400/14 text-emerald-700 dark:text-emerald-300",
  warning: "border-amber-400/35 bg-amber-400/14 text-amber-700 dark:text-amber-300",
  destructive: "border-destructive/30 bg-destructive/12 text-destructive",
};

export function StatusBadge({ children, tone = "neutral", className }: StatusBadgeProps) {
  const classes = [
    "inline-flex items-center rounded-[var(--radius-pill)] border px-2 py-0.5 text-[10px] font-semibold tracking-wide",
    TONE_CLASS[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
