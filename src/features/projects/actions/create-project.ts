"use server";

import { db } from "@/lib/db";
import { project } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getUserWorkspace } from "@/features/workspaces/queries/get-user-workspace";
import { createProjectSchema } from "@/lib/validations/project";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CreateProjectResult =
  | {
      success: true;
      project: {
        id: string;
        workspaceId: string;
        name: string;
        description: string | null;
      };
    }
  | {
      success: false;
      message: string;
      fieldErrors?: {
        name?: string[];
        description?: string[];
      };
    };

export async function createProjectAction(
  formData: FormData,
  workspaceId: string,
): Promise<CreateProjectResult> {
  // 1. Authenticate the user.
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "You must be signed in to create a project.",
    };
  }

  // 2. Validate the workspace ID.
  if (!UUID_PATTERN.test(workspaceId)) {
    return {
      success: false,
      message: "Invalid workspace.",
    };
  }

  // 3. Verify workspace membership and authorization.
  const currentWorkspace = await getUserWorkspace({
    workspaceId,
    userId: session.user.id,
  });

  if (!currentWorkspace) {
    return {
      success: false,
      message: "Workspace not found.",
    };
  }

  if (currentWorkspace.role !== "OWNER" && currentWorkspace.role !== "ADMIN") {
    return {
      success: false,
      message: "You don't have permission to create projects.",
    };
  }

  // 4. Validate project input.
  const validationResult = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "Please correct the project details.",
      fieldErrors: {
        name: validationResult.error.issues
          .filter((issue) => issue.path[0] === "name")
          .map((issue) => issue.message),

        description: validationResult.error.issues
          .filter((issue) => issue.path[0] === "description")
          .map((issue) => issue.message),
      },
    };
  }

  const { name, description } = validationResult.data;

  // 5. Create the project.
  try {
    const [createdProject] = await db
      .insert(project)
      .values({
        workspaceId,
        name,
        description: description || null,
      })
      .returning({
        id: project.id,
        workspaceId: project.workspaceId,
        name: project.name,
        description: project.description,
      });

    return {
      success: true,
      project: createdProject,
    };
  } catch {
    return {
      success: false,
      message: "We couldn't create your project. Please try again.",
    };
  }
}
