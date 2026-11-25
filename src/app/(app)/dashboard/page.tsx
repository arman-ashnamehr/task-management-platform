import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getUserWorkspaces } from "@/features/workspaces/queries/get-user-workspaces";

import { EmptyWorkspaces } from "@/features/workspaces/components/empty-workspace";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { WorkspaceCard } from "@/features/workspaces/components/workspace-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const workspaces = await getUserWorkspaces(session.user.id);

  if (workspaces.length === 0) {
    return <EmptyWorkspaces />;
  }

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-2 text-slate-400">
          Welcome {session.user.name} to TaskFlow.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Your Workspaces</h2>

          <p className="mt-1 text-sm text-slate-400">
            Workspaces you belong to and collaborate in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="mb-5 text-lg font-semibold text-white">
          Create another workspace
        </h2>

        <CreateWorkspaceForm />
      </div>
    </section>
  );
}
