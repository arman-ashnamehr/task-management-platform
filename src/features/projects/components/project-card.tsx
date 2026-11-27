import Link from "next/link";

import type { getWorkspaceProjects } from "@/features/projects/queries/get-workspace-projects";

type ProjectCardProps = {
  project: Awaited<ReturnType<typeof getWorkspaceProjects>>[number];
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      href={`/workspace/${project.workspaceId}/project/${project.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-indigo-500/50 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <h3 className="font-semibold text-white">{project.name}</h3>

      {project.description ?
        <p className="mt-2 text-sm leading-6 text-slate-400">
          {project.description}
        </p>
      : <p className="mt-2 text-sm text-slate-500">No description provided.</p>}

      <p className="mt-4 text-xs text-slate-500">
        Created{" "}
        {project.createdAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>
    </Link>
  );
}
