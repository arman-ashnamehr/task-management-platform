import { CreateWorkspaceForm } from "./create-workspace-form";

export function EmptyWorkspaces() {
  return (
    <section className="mx-auto max-w-xl space-y-8 py-16">
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-8"
            aria-hidden="true"
          >
            <path d="M3.5 7.5h7l2 2h8v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
            <path d="M12 12.5v5" />
            <path d="M9.5 15h5" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Create your first workspace
        </h1>

        <p className="text-sm leading-6 text-slate-400">
          Workspaces help you organize your team, projects, and tasks in one
          place. Create a workspace to get started with TaskFlow.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <CreateWorkspaceForm />
      </div>
    </section>
  );
}
