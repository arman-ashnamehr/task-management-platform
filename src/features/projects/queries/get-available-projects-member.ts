import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMember, user, workspaceMember } from "@/lib/db/schema";

import { getUserProject } from "./get-user-project";

type GetAvailableProjectMembersParams = {
  projectId: string;
  userId: string;
};

export async function getAvailableProjectMembers({
  projectId,
  userId,
}: GetAvailableProjectMembersParams) {
  // Verify project access and retrieve the actor's roles.
  const currentProject = await getUserProject({
    projectId,
    userId,
  });

  if (!currentProject) {
    return [];
  }

  // Only workspace administrators and project managers
  // can retrieve users eligible for project membership.
  const canManageMembers =
    currentProject.workspaceRole === "OWNER" ||
    currentProject.workspaceRole === "ADMIN" ||
    currentProject.projectRole === "MANAGER";

  if (!canManageMembers) {
    return [];
  }

  return db
    .select({
      userId: workspaceMember.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      workspaceJoinedAt: workspaceMember.joinedAt,
    })
    .from(workspaceMember)
    .innerJoin(user, eq(workspaceMember.userId, user.id))
    .leftJoin(
      projectMember,
      and(
        eq(projectMember.projectId, projectId),
        eq(projectMember.userId, workspaceMember.userId),
      ),
    )
    .where(
      and(
        eq(workspaceMember.workspaceId, currentProject.workspaceId),
        eq(workspaceMember.role, "MEMBER"),
        isNull(projectMember.id),
      ),
    )
    .orderBy(user.name);
}
