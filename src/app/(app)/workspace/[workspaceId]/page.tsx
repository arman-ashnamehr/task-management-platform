import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { getUserWorkspace } from "@/features/workspaces/queries/get-user-workspace";
import { getWorkspaceProjects } from "@/features/projects/queries/get-workspace-projects";
import { ProjectList } from "@/features/projects/components/project-list";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";

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
  const projects = await getWorkspaceProjects({
    workspaceId,
    userId: session.user.id,
  });

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-white">Projects</h2>
        <p className="mt-1 text-sm text-slate-400">
          Projects in this workspace.
        </p>
      </div>
      {(currentWorkspace.role === "OWNER" ||
        currentWorkspace.role === "ADMIN") && (
        <CreateProjectForm workspaceId={workspaceId} />
      )}
      <ProjectList projects={projects} />
    </section>
  );
}
