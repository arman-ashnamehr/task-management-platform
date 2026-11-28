"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMember, workspaceMember } from "@/lib/db/schema";

import { getSession } from "@/lib/auth/session";
import { getUserProject } from "@/features/projects/queries/get-user-project";
import { addProjectMemberSchema } from "@/lib/validations/project-member";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AddProjectMemberResult =
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
      fieldErrors?: {
        userId?: string[];
        role?: string[];
      };
    };

export async function addProjectMemberAction(
  formData: FormData,
  projectId: string,
): Promise<AddProjectMemberResult> {
  // 1. Authenticate the current user.
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "You must be signed in to add a project member.",
    };
  }

  // 2. Validate the project ID format.
  if (!UUID_PATTERN.test(projectId)) {
    return {
      success: false,
      message: "Invalid project.",
    };
  }

  // 3. Validate the submitted form data.
  const validationResult = addProjectMemberSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "Please correct the submitted information.",
      fieldErrors: {
        userId: validationResult.error.issues
          .filter((issue) => issue.path[0] === "userId")
          .map((issue) => issue.message),

        role: validationResult.error.issues
          .filter((issue) => issue.path[0] === "role")
          .map((issue) => issue.message),
      },
    };
  }

  const { userId, role } = validationResult.data;

  try {
    // 4. Verify project access and retrieve the actor's roles.
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

    // 5. Check whether the actor can manage project membership.
    const isWorkspaceAdmin =
      currentProject.workspaceRole === "OWNER" ||
      currentProject.workspaceRole === "ADMIN";

    const isProjectManager = currentProject.projectRole === "MANAGER";

    if (!isWorkspaceAdmin && !isProjectManager) {
      return {
        success: false,
        message: "You don't have permission to add project members.",
      };
    }

    // 6. Only workspace administrators can assign MANAGER.
    if (role === "MANAGER" && !isWorkspaceAdmin) {
      return {
        success: false,
        message: "Only workspace administrators can assign the MANAGER role.",
      };
    }

    // 7. Verify that the target user belongs to this workspace.
    const [targetMembership] = await db
      .select({
        userId: workspaceMember.userId,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, currentProject.workspaceId),
          eq(workspaceMember.userId, userId),
        ),
      )
      .limit(1);

    if (!targetMembership) {
      return {
        success: false,
        message: "The selected user is not a member of this workspace.",
      };
    }

    // OWNER and ADMIN already have automatic access to every project.
    // We only add regular workspace members through this operation.
    if (targetMembership.role !== "MEMBER") {
      return {
        success: false,
        message:
          "Workspace administrators already have automatic project access.",
      };
    }

    // 8. Insert the project membership.
    // The unique constraint protects against duplicate membership,
    // including concurrent requests.
    const [insertedMember] = await db
      .insert(projectMember)
      .values({
        projectId,
        workspaceId: currentProject.workspaceId,
        userId,
        role,
      })
      .onConflictDoNothing({
        target: [projectMember.projectId, projectMember.userId],
      })
      .returning({
        id: projectMember.id,
        userId: projectMember.userId,
        role: projectMember.role,
      });

    if (!insertedMember) {
      return {
        success: false,
        message: "This user is already a member of the project.",
      };
    }

    return {
      success: true,
      member: insertedMember,
    };
  } catch {
    return {
      success: false,
      message: "We couldn't add this project member. Please try again.",
    };
  }
}
