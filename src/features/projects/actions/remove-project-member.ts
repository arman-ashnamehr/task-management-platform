"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMember } from "@/lib/db/schema";

import { getSession } from "@/lib/auth/session";
import { getUserProject } from "@/features/projects/queries/get-user-project";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type RemoveProjectMemberResult =
  | {
      success: true;
      member: {
        id: string;
        userId: string;
        role: "MANAGER" | "MEMBER";
      };
    }
  | {
      success: false;
      message: string;
    };

export async function removeProjectMemberAction(
  projectId: string,
  targetUserId: string,
): Promise<RemoveProjectMemberResult> {
  // 1. Authenticate the actor.
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "You must be signed in to remove a project member.",
    };
  }

  // 2. Validate the project ID and target user ID.
  const normalizedTargetUserId = targetUserId.trim();

  if (
    !UUID_PATTERN.test(projectId) ||
    !normalizedTargetUserId ||
    normalizedTargetUserId.length > 255
  ) {
    return {
      success: false,
      message: "Invalid project or user.",
    };
  }

  try {
    // 3. Verify the actor's access and retrieve their current roles.
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

    // 4. Determine whether the actor can manage membership.
    const isWorkspaceAdmin =
      currentProject.workspaceRole === "OWNER" ||
      currentProject.workspaceRole === "ADMIN";

    const isProjectManager = currentProject.projectRole === "MANAGER";

    if (!isWorkspaceAdmin && !isProjectManager) {
      return {
        success: false,
        message: "You don't have permission to remove project members.",
      };
    }

    // 5. Find the target's existing project membership.
    const [targetMembership] = await db
      .select({
        id: projectMember.id,
        userId: projectMember.userId,
        role: projectMember.role,
      })
      .from(projectMember)
      .where(
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, normalizedTargetUserId),
        ),
      )
      .limit(1);

    if (!targetMembership) {
      return {
        success: false,
        message: "This user is not a member of the project.",
      };
    }

    // 6. Only workspace administrators can remove a MANAGER.
    if (targetMembership.role === "MANAGER" && !isWorkspaceAdmin) {
      return {
        success: false,
        message: "Only workspace administrators can remove a project manager.",
      };
    }

    // 7. Delete the membership.
    // For a Project MANAGER, the DELETE condition also requires
    // the target's role to still be MEMBER.
    const deleteConditions =
      isWorkspaceAdmin ?
        and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, normalizedTargetUserId),
        )
      : and(
          eq(projectMember.projectId, projectId),
          eq(projectMember.userId, normalizedTargetUserId),
          eq(projectMember.role, "MEMBER"),
        );

    const [deletedMember] = await db
      .delete(projectMember)
      .where(deleteConditions)
      .returning({
        id: projectMember.id,
        userId: projectMember.userId,
        role: projectMember.role,
      });

    if (!deletedMember) {
      return {
        success: false,
        message: "The membership changed or can no longer be removed.",
      };
    }

    return {
      success: true,
      member: deletedMember,
    };
  } catch {
    return {
      success: false,
      message: "We couldn't remove this project member. Please try again.",
    };
  }
}
