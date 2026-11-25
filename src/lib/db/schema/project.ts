import {
  pgTable,
  uuid,
  text,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { workspace } from "./workspace";

export const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    description: text("description"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("project_id_workspace_id_unique").on(table.id, table.workspaceId),

    index("project_workspace_id_idx").on(table.workspaceId),
  ],
);
