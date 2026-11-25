import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { workspace, workspaceMember } from "@/lib/db/schema";

export async function getUserWorkspaces(userId: string) {
  return db
    .select({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: workspaceMember.role,
      joinedAt: workspaceMember.joinedAt,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(desc(workspaceMember.joinedAt));
}
