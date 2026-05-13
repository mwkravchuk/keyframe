import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "subtle" | "destructive";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-accent-foreground hover:opacity-90",
  outline: "border-border bg-card text-foreground hover:bg-muted",
  ghost: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:text-foreground",
  subtle: "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
  destructive: "border-destructive/40 bg-destructive/12 text-destructive hover:bg-destructive/18",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3 text-sm",
  icon: "h-9 w-9",
};

export function Button({ variant = "outline", size = "md", className, type = "button", children, ...props }: ButtonProps) {
  const classes = [
    "inline-flex cursor-pointer items-center justify-center rounded-md border font-medium transition duration-200 ease-[var(--ease-standard)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
