import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMember, user } from "@/lib/db/schema";

import { getUserProject } from "./get-user-project";

type GetProjectMembersParams = {
  projectId: string;
  userId: string;
};

export async function getProjectMembers({
  projectId,
  userId,
}: GetProjectMembersParams) {
  // First, verify that the current user can access this project.
  const currentProject = await getUserProject({
    projectId,
    userId,
  });

  if (!currentProject) {
    return [];
  }

  // Retrieve explicit project memberships and their user information.
  return db
    .select({
      id: projectMember.id,
      userId: projectMember.userId,
      name: user.name,
      email: user.email,
      image: user.image,
      role: projectMember.role,
      joinedAt: projectMember.joinedAt,
    })
    .from(projectMember)
    .innerJoin(user, eq(projectMember.userId, user.id))
    .where(eq(projectMember.projectId, projectId))
    .orderBy(projectMember.joinedAt);
}
