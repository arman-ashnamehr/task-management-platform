import { describe, expect, it } from "vitest";
import { createWorkspaceSchema } from "./workspace";

describe("createWorkspaceSchema", () => {
  it("accepts a valid workspace name", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "Engineering Team",
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "  Engineering Team  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Engineering Team");
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 50 characters", () => {
    const result = createWorkspaceSchema.safeParse({
      name: "A".repeat(51),
    });

    expect(result.success).toBe(false);
  });
});
