import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function SectionHeader({ title, description, eyebrow, actions }: SectionHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
