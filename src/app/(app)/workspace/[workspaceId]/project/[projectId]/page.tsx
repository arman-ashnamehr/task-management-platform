import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getUserProject } from "@/features/projects/queries/get-user-project";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Project",
};

type ProjectPageProps = {
  params: Promise<{
    workspaceId: string;
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  //Authentication. identifies the sign-in user.
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { workspaceId, projectId } = await params;

  //Authorization. Checks workspace membership and project access.
  const currentProject = await getUserProject({
    projectId,
    userId: session.user.id,
  });

  if (!currentProject) {
    notFound();
  }

  // Ensure the project actually belongs to the workspace in the URL.
  if (currentProject.workspaceId !== workspaceId) {
    notFound();
  }

  const accessRole =
    (
      currentProject.workspaceRole === "OWNER" ||
      currentProject.workspaceRole === "ADMIN"
    ) ?
      `Workspace ${currentProject.workspaceRole}`
    : `Project ${currentProject.projectRole}`;

  return (
    <section className="space-y-8">
      <div>
        <Link
          href={`/workspace/${workspaceId}`}
          className="text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to workspace
        </Link>

        <div className="mt-5">
          <p className="text-sm text-slate-400">Project</p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            {currentProject.name}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {currentProject.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">Your access</p>
          <p className="mt-2 font-semibold text-white">{accessRole}</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <p className="text-sm text-slate-400">Created</p>
          <p className="mt-2 font-semibold text-white">
            {currentProject.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
        <h2 className="font-semibold text-white">Project overview</h2>
        <p className="mt-2 text-sm text-slate-400">
          Tasks and project management features will be available here in
          upcoming milestones.
        </p>
      </div>
    </section>
  );
}
