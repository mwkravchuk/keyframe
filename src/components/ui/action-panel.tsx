import type { ReactNode } from "react";

type ActionPanelProps = {
  children: ReactNode;
  className?: string;
};

export function ActionPanel({ children, className }: ActionPanelProps) {
  const classes = [
    "kf-action-panel rounded-lg border border-border bg-card/92 p-3 shadow-soft supports-[backdrop-filter]:bg-card/80 supports-[backdrop-filter]:backdrop-blur",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <section className={classes}>{children}</section>;
}
