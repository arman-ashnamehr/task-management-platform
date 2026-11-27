import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  unique,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";

import { project } from "./project";
import { workspaceMember } from "./workspace";

export const projectRoleEnum = pgEnum("project_role", ["MANAGER", "MEMBER"]);

export const projectMember = pgTable(
  "project_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id").notNull(),

    workspaceId: uuid("workspace_id").notNull(),

    userId: text("user_id").notNull(),

    role: projectRoleEnum("role").notNull().default("MEMBER"),

    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    // A user can only have one membership record per project.
    unique("project_member_project_user_unique").on(
      table.projectId,
      table.userId,
    ),

    // The project must belong to the same workspace recorded here.
    foreignKey({
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
      name: "project_member_project_workspace_fk",
    }).onDelete("cascade"),

    // The user must be a member of that same workspace.
    foreignKey({
      columns: [table.workspaceId, table.userId],
      foreignColumns: [workspaceMember.workspaceId, workspaceMember.userId],
      name: "project_member_workspace_user_fk",
    }).onDelete("cascade"),

    // Helps retrieve all project memberships belonging to a user.
    index("project_member_user_id_idx").on(table.userId),

    // Supports lookups and referential operations using workspace membership.
    index("project_member_workspace_user_idx").on(
      table.workspaceId,
      table.userId,
    ),
  ],
);
