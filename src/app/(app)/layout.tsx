import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AppHeader } from "@/components/layouts/app-header";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { getSession } from "@/lib/auth/session";

type AppLayoutProps = {
  children: ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white">
      <AppHeader user={session.user} />

      <div className="flex flex-1">
        <AppSidebar />
        <main className="min-w-0 flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
