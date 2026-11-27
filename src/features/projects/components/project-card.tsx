import type { getWorkspaceProjects } from "../queries/get-workspace-projects";

type ProjectCardProps = {
  project: Awaited<ReturnType<typeof getWorkspaceProjects>>[number];
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 ">
      <h3 className="font-semibold text-white">
        {project.name}

        {project.description ?
          <p className="text-sm text-slate-400 leading-6 mt-2">
            {project.description}
          </p>
        : <p className="mt-2 text-sm text-slate-500">There is no description</p>
        }
      </h3>
    </article>
  );
}
