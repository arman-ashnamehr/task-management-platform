import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getUserWorkspace } from "@/features/workspaces/queries/get-user-workspace";

export const metadata: Metadata = {
  title: "Workspace",
};

type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }
  //In modern Next.js App Router, dynamic route parameters are asynchronous.
  const { workspaceId } = await params;

  const currentWorkspace = await getUserWorkspace({
    workspaceId,
    userId: session.user.id,
  });
  //We deliberately treat a nonexistent workspace and an inaccessible workspace identically.
  if (!currentWorkspace) {
    notFound();
  }

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm text-slate-400">Workspace</p>

        <h1 className="mt-2 text-3xl font-bold text-white">
          {currentWorkspace.name}
        </h1>

        <p className="mt-2 text-sm text-slate-400">/{currentWorkspace.slug}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">Your role</p>

          <p className="mt-2 text-xl font-semibold text-white">
            {currentWorkspace.role}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <p className="text-sm text-slate-400">Joined workspace</p>

          <p className="mt-2 text-xl font-semibold text-white">
            {currentWorkspace.joinedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Workspace overview</h2>

        <p className="mt-2 text-sm text-slate-400">
          Your workspace is ready. Project and task management features will be
          available here as we build them.
        </p>
      </div>
    </section>
  );
}
