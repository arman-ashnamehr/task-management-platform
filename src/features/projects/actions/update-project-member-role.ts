"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMember } from "@/lib/db/schema";

import { getSession } from "@/lib/auth/session";
import { getUserProject } from "@/features/projects/queries/get-user-project";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ProjectMemberRole = "MANAGER" | "MEMBER";

export type UpdateProjectMemberRoleResult =
  | {
      success: true;
      member: {
        id: string;
        userId: string;
        role: ProjectMemberRole;
      };
    }
  | {
      success: false;
      message: string;
    };

export async function updateProjectMemberRoleAction(
  projectId: string,
  targetUserId: string,
  requestedRole: string,
): Promise<UpdateProjectMemberRoleResult> {
  // 1. Authenticate the actor.
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "You must be signed in to change project member roles.",
    };
  }

  // 2. Validate the untrusted input.
  const normalizedTargetUserId = targetUserId.trim();

  if (
    !UUID_PATTERN.test(projectId) ||
    !normalizedTargetUserId ||
    normalizedTargetUserId.length > 255 ||
    (requestedRole !== "MANAGER" && requestedRole !== "MEMBER")
  ) {
    return {
      success: false,
      message: "Invalid project, user, or role.",
    };
  }

  try {
    // 3. Verify that the actor can access this project.
    const currentProject = await getUserProject({
      projectId,
      userId: session.user.id,
    });

    if (!currentProject) {
      return {
        success: false,
        message: "Project not found.",
      };
    }

    // 4. Only Workspace Owners and Admins can change project roles.
    const isWorkspaceAdmin =
      currentProject.workspaceRole === "OWNER" ||
      currentProject.workspaceRole === "ADMIN";

    if (!isWorkspaceAdmin) {
      return {
        success: false,
        message:
          "Only workspace administrators can change project member roles.",
      };
    }

    // 5. Update the target user's explicit project membership.
    const [updatedMember] = await db
      .update(projectMember)
      .set({
        role: requestedRole,
      })
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, normalizedTargetUserId),
        ),
      )
      .returning({
        id: projectMember.id,
        userId: projectMember.userId,
        role: projectMember.role,
      });

    // 6. No returned row means there was no matching membership to update.
    if (!updatedMember) {
      return {
        success: false,
        message: "This user is not a member of the project.",
      };
    }

    return {
      success: true,
      member: updatedMember,
    };
  } catch {
    return {
      success: false,
      message:
        "We couldn't update this project member's role. Please try again.",
    };
  }
}
