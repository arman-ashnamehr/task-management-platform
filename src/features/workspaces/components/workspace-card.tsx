import Link from "next/link";

import type { getUserWorkspaces } from "@/features/workspaces/queries/get-user-workspaces";

type WorkspaceCardProps = {
  workspace: Awaited<ReturnType<typeof getUserWorkspaces>>[number];
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      href={`/workspace/${workspace.id}`}
      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-indigo-500/50 hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white">
            {workspace.name}
          </h2>

          <p className="mt-1 truncate text-sm text-slate-400">
            /{workspace.slug}
          </p>
        </div>

        <span className="shrink-0 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          {workspace.role}
        </span>
      </div>

      <div className="mt-6 border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500">
          Joined{" "}
          {workspace.joinedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </Link>
  );
}
