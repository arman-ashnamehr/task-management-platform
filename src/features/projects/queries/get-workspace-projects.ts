import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { project, workspaceMember } from "@/lib/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GetWorkspaceProjectsParams = {
  workspaceId: string;
  userId: string;
};

export async function getWorkspaceProjects({
  workspaceId,
  userId,
}: GetWorkspaceProjectsParams) {
  if (!UUID_PATTERN.test(workspaceId)) {
    return [];
  }

  const gg = db
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      eq(project.workspaceId, workspaceMember.workspaceId),
    )
    .where(
      and(
        eq(project.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .orderBy(desc(project.createdAt));
  return gg;
}
