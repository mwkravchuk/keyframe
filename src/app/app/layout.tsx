import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative grid min-h-screen w-full gap-0 bg-background lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="border-l border-border px-6 py-10 lg:px-10">{children}</main>
    </div>
  );
}
