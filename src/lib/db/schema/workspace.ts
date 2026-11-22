import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Workspace-level permissions
export const workspaceRoleEnum = pgEnum("workspace_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
export const workspace = pgTable(
  "workspace",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: text("name").notNull(),

    slug: text("slug").notNull(),
    // Sets the time ONLY when the user is first created
    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      // Updates the time EVERY TIME the user record is modified
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("workspace_slug_unique").on(table.slug)],
);

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    role: workspaceRoleEnum("role").notNull().default("MEMBER"),

    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    unique("workspace_member_workspace_user_unique").on(
      table.workspaceId,
      table.userId,
    ),

    index("workspace_member_user_id_idx").on(table.userId),
  ],
);

// Workspace → Members
export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(workspaceMember),
}));

// Membership → Workspace and User
export const workspaceMemberRelations = relations(
  // Each membership belongs to exactly one workspace and exactly one user.
  workspaceMember,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),

    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
  }),
);
