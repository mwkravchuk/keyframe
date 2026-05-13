import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldLabelProps = {
  htmlFor: string;
  children: ReactNode;
  muted?: boolean;
};

export function FieldLabel({ htmlFor, children, muted = false }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={[
        "text-xs font-semibold uppercase tracking-wide",
        muted ? "text-muted-foreground" : "text-foreground",
      ].join(" ")}
    >
      {children}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  const classes = [
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/55",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <input className={classes} {...props} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  const classes = [
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/55",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <textarea className={classes} {...props} />;
}
