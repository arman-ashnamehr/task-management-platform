import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(50, "Workspace name cannot exceed 50 characters."),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
