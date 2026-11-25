import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./project";

describe("createProjectSchema", () => {
  it("accepts a valid project name", () => {
    const result = createProjectSchema.safeParse({
      name: "Task flow",
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    const result = createProjectSchema.safeParse({
      name: "  Task Flow  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.name).toBe("Task Flow");
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "A",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createProjectSchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    const result = createProjectSchema.safeParse({
      name: "   ",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 100 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "A".repeat(101),
    });

    expect(result.success).toBe(false);
  });

  it("accepts a project without a description", () => {
    const result = createProjectSchema.safeParse({
      name: "Task Flow",
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid description", () => {
    const result = createProjectSchema.safeParse({
      name: "Task Flow",
      description: "A task management project.",
    });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace from the description", () => {
    const result = createProjectSchema.safeParse({
      name: "Task Flow",
      description: "  Manage tasks efficiently.  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.description).toBe("Manage tasks efficiently.");
    }
  });

  it("rejects a description longer than 500 characters", () => {
    const result = createProjectSchema.safeParse({
      name: "Task Flow",
      description: "A".repeat(501),
    });

    expect(result.success).toBe(false);
  });
});
