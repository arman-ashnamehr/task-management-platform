import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspace, workspaceMember } from "@/lib/db/schema";

// we should check the query string because An arbitrary string could otherwise cause a database error.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type GetUserWorkspaceParams = {
  workspaceId: string;
  userId: string;
};

export async function getUserWorkspace({
  workspaceId,
  userId,
}: GetUserWorkspaceParams) {
  if (!UUID_PATTERN.test(workspaceId)) {
    return null;
  }

  const [result] = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: workspaceMember.role,
      joinedAt: workspaceMember.joinedAt,
    })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(
      /**Both conditions must match.
         This prevents a user from accessing another workspace simply by changing the UUID in the browser's address bar. */
      and(eq(workspace.id, workspaceId), eq(workspaceMember.userId, userId)),
    )
    .limit(1);
  //The query returns null for an invalid UUID or when no matching membership exists.
  return result ?? null;
}
