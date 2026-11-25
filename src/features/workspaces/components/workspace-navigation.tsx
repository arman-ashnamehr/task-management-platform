import Link from "next/link";

import { AppNavLink } from "@/components/layouts/app-nav-link";

type WorkspaceNavigationProps = {
  workspaceId: string;
};

export function WorkspaceNavigation({ workspaceId }: WorkspaceNavigationProps) {
  const workspaceUrl = `/workspace/${workspaceId}`;

  return (
    <nav
      aria-label="Workspace navigation"
      className="flex flex-wrap items-center gap-6 border-b border-slate-800 pb-4 text-sm"
    >
      <AppNavLink href={workspaceUrl}>Overview</AppNavLink>

      <Link
        href="/dashboard"
        className="text-slate-400 transition hover:text-white"
      >
        All workspaces
      </Link>
    </nav>
  );
}
