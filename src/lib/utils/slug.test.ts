import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("converts a name to lowercase", () => {
    expect(slugify("Engineering Team")).toBe("engineering-team");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("TaskFlow Workspace")).toBe("taskflow-workspace");
  });

  it("removes punctuation", () => {
    expect(slugify("Frontend & Backend!")).toBe("frontend-backend");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  My Workspace  ")).toBe("my-workspace");
  });

  it("normalizes Unicode characters", () => {
    expect(slugify("ＡＢＣ Team")).toBe("abc-team");
  });

  it("supports non-Latin names", () => {
    expect(slugify("Հայկական թիմ")).toBe("հայկական-թիմ");
  });

  it("returns a fallback for names without letters or numbers", () => {
    expect(slugify("🔥✨")).toBe("workspace");
  });
});
