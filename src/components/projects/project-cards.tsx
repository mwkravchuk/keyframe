import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

function DragHandle() {
  return (
    <span className="rounded-md border border-border p-1 text-muted-foreground opacity-20 transition group-hover:opacity-100">
      <GripVertical size={14} />
    </span>
  );
}

type CardFrameProps = {
  children: ReactNode;
  className?: string;
  dragging?: boolean;
};

function CardFrame({ children, className, dragging = false }: CardFrameProps) {
  const classes = [
    "group rounded-md border bg-card px-3 py-2.5 shadow-soft transition duration-200 ease-[var(--ease-standard)]",
    dragging
      ? "border-accent opacity-35"
      : "border-border hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-card active:translate-y-0",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <article className={classes}>{children}</article>;
}

type IdeaCardProps = {
  title: string;
  dragging?: boolean;
  className?: string;
};

export function IdeaCard({ title, dragging = false, className }: IdeaCardProps) {
  return (
    <CardFrame dragging={dragging} className={className}>
      <div className="flex items-center justify-between gap-2 border-l-2 border-border/80 pl-2">
        <p className="line-clamp-2 text-[12px] leading-snug text-foreground/95">{title}</p>
        <DragHandle />
      </div>
    </CardFrame>
  );
}

type VideoCardProps = {
  title: string;
  summary: string;
  dragging?: boolean;
  className?: string;
  channel?: ReactNode;
  thumbnailUrl?: string | null;
};

export function VideoCard({
  title,
  summary,
  dragging = false,
  className,
  channel,
  thumbnailUrl,
}: VideoCardProps) {
  return (
    <CardFrame dragging={dragging} className={className}>
      {thumbnailUrl ? (
        <div className="mb-2 overflow-hidden rounded-sm border border-border/70 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnailUrl}
            alt="Project video thumbnail"
            className="h-20 w-full object-cover"
            loading="lazy"
          />
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground">{title}</p>
        <div className="flex items-center gap-1.5">
          {channel}
          <DragHandle />
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{summary}</p>
    </CardFrame>
  );
}
