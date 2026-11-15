import * as z from "zod";

const emailSchema = z
  .string()
  .trim()
  .pipe(
    z.email({
      error: "Please enter a valid email address.",
    }),
  );

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, {
      error: "Please enter your full name.",
    }),

    email: emailSchema,

    password: z.string().min(8, {
      error: "Password must contain at least 8 characters.",
    }),

    confirmPassword: z.string().min(1, {
      error: "Please confirm your password.",
    }),
  })
  .refine(
    ({ password, confirmPassword }) =>
      !confirmPassword || password === confirmPassword,
    {
      path: ["confirmPassword"],
      error: "Passwords do not match.",
    },
  );

export const loginSchema = z.object({
  email: emailSchema,

  password: z.string().min(1, {
    error: "Please enter your password.",
  }),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export type LoginFormValues = z.infer<typeof loginSchema>;
