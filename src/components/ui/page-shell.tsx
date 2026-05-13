import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  return <main className="mx-auto w-full max-w-7xl px-6 pb-10 pt-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>;
}
