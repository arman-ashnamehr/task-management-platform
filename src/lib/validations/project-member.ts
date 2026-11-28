import { z } from "zod";

export const addProjectMemberSchema = z.object({
  userId: z
    .string()
    .trim()
    .min(1, "Please select a user.")
    .max(255, "Invalid user ID."),

  role: z.enum(["MANAGER", "MEMBER"]),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
