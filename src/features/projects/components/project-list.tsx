import type { getWorkspaceProjects } from "@/features/projects/queries/get-workspace-projects";

import { ProjectCard } from "./project-card";

type ProjectListProps = {
  projects: Awaited<ReturnType<typeof getWorkspaceProjects>>;
};

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 px-6 py-12 text-center">
        <h3 className="font-semibold text-white">No projects yet</h3>

        <p className="mt-2 text-sm text-slate-400">
          Projects help you organize tasks and collaborate with your team.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
