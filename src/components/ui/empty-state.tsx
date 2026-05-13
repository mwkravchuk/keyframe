import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-lg border border-dashed border-border bg-card/55 text-center",
        compact ? "px-3 py-4" : "px-6 py-8",
      ].join(" ")}
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
