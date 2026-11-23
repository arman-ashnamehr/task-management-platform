"use server";

import { db } from "@/lib/db";
import { workspace, workspaceMember } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { slugify } from "@/lib/utils/slug";

const MAX_SLUG_ATTEMPTS = 100;

type CreateWorkspaceResult =
  //The leading | just makes multiline unions visually aligned and easy to scan when adding or removing branches.
  | {
      success: true;
      workspace: {
        id: string;
        name: string;
        slug: string;
      };
    }
  | {
      success: false;
      message: string;
      fieldErrors?: {
        name?: string[];
      };
    };

export async function createWorkspaceAction(
  formData: FormData,
): Promise<CreateWorkspaceResult> {
  // 1. Authenticate the user.
  const session = await getSession();

  if (!session) {
    return {
      success: false,
      message: "You must be signed in to create a workspace.",
    };
  }

  // 2. Validate the submitted input.
  const validationResult = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validationResult.success) {
    return {
      success: false,
      message: "Please correct the workspace name.",
      fieldErrors: {
        name: validationResult.error.issues
          .filter((issue) => issue.path[0] === "name")
          .map((issue) => issue.message),
      },
    };
  }

  const { name } = validationResult.data;
  const baseSlug = slugify(name);

  try {
    // 3. Create the workspace and its owner membership atomically.
    const createdWorkspace = await db.transaction(async (tx) => {
      let insertedWorkspace:
        | {
            id: string;
            name: string;
            slug: string;
          }
        | undefined;

      // 4. Find an available slug.
      // The database's unique constraint remains the final authority.
      for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
        const candidateSlug =
          attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;

        const [inserted] = await tx
          //Instead of running a separate SELECT to check if the slug exists (which has a race condition
          // if two users create "Acme Studio" at the exact same millisecond), it tries to INSERT directly inside transaction tx.
          .insert(workspace)
          .values({
            name,
            slug: candidateSlug,
          })
          //If candidateSlug already exists in workspace.slug,
          // PostgreSQL hits the unique constraint and skips the insert without throwing a duplicate-key error (onConflictDoNothing).
          .onConflictDoNothing({
            target: workspace.slug,
          })
          //Because nothing was inserted, .returning(...) returns an empty array [], so inserted is undefined.
          .returning({
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
          });

        if (inserted) {
          insertedWorkspace = inserted;
          break;
        }
      }

      if (!insertedWorkspace) {
        throw new Error("Unable to generate an available workspace slug.");
      }

      // 5. Assign the authenticated user as the workspace owner.
      await tx.insert(workspaceMember).values({
        workspaceId: insertedWorkspace.id,
        userId: session.user.id,
        role: "OWNER",
      });

      return insertedWorkspace;
    });

    return {
      success: true,
      workspace: createdWorkspace,
    };
  } catch {
    // Avoid exposing database errors or internal implementation details.
    return {
      success: false,
      message: "We couldn't create your workspace. Please try again.",
    };
  }
}
