import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <section>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-slate-400">
        Welcome {session.user.name} to our TaskFlow workspace.
      </p>
    </section>
  );
}
