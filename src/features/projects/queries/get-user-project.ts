import { and, eq, isNotNull, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { project, projectMember, workspaceMember } from "@/lib/db/schema";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GetUserProjectParams = {
  projectId: string;
  userId: string;
};

export async function getUserProject({
  projectId,
  userId,
}: GetUserProjectParams) {
  if (!UUID_PATTERN.test(projectId)) {
    return null;
  }

  const [result] = await db
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      workspaceRole: workspaceMember.role,
      projectRole: projectMember.role,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, project.workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .leftJoin(
      projectMember,
      and(
        eq(projectMember.projectId, project.id),
        eq(projectMember.userId, userId),
      ),
    )
    .where(
      and(
        eq(project.id, projectId),
        or(
          eq(workspaceMember.role, "OWNER"),
          eq(workspaceMember.role, "ADMIN"),
          isNotNull(projectMember.id),
        ),
      ),
    )
    .limit(1);

  return result ?? null;
}
