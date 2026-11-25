import type { ReactNode } from "react";

import { WorkspaceNavigation } from "@/features/workspaces/components/workspace-navigation";

type WorkspaceLayoutProps = {
  children: ReactNode;
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params;

  return (
    <div className="space-y-6">
      <WorkspaceNavigation workspaceId={workspaceId} />

      <div>{children}</div>
    </div>
  );
}
