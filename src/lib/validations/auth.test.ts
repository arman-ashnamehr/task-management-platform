import { describe, expect, it } from "vitest";
/** describe() groups related tests.
    it() defines one behavior.
    expect() makes an assertion. */
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email address", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });

  it("trims whitespace around the email", () => {
    const result = loginSchema.safeParse({
      email: "  user@example.com  ",
      password: "password123",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

describe("registerSchema", () => {
  const validRegistration = {
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
    confirmPassword: "password123",
  };

  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);
  });

  it("rejects passwords shorter than eight characters", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "different-password",
    });

    expect(result.success).toBe(false);
  });
});
