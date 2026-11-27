import { beforeEach, describe, expect, it, vi } from "vitest";

import { getUserProject } from "./get-user-project";
import { project, projectMember, workspaceMember } from "@/lib/db/schema";

// Keep the database mocks available to the vi.mock factory.
const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
  innerJoin: vi.fn(),
  leftJoin: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.select,
  },
}));

const queryBuilder = {
  from: mocks.from,
  innerJoin: mocks.innerJoin,
  leftJoin: mocks.leftJoin,
  where: mocks.where,
  limit: mocks.limit,
};

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "user-123";

const mockProject = {
  id: PROJECT_ID,
  workspaceId: "22222222-2222-4222-8222-222222222222",
  name: "Website Redesign",
  description: "Redesign the company website.",
  createdAt: new Date("2026-01-10T10:00:00.000Z"),
  updatedAt: new Date("2026-01-11T10:00:00.000Z"),
  workspaceRole: "OWNER" as const,
  projectRole: null,
};

describe("getUserProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Each query-building method returns the same chainable object.
    mocks.select.mockReturnValue(queryBuilder);
    mocks.from.mockReturnValue(queryBuilder);
    mocks.innerJoin.mockReturnValue(queryBuilder);
    mocks.leftJoin.mockReturnValue(queryBuilder);
    mocks.where.mockReturnValue(queryBuilder);

    // The final query operation returns the rows.
    mocks.limit.mockResolvedValue([mockProject]);
  });

  it("returns null when the project ID is not a valid UUID", async () => {
    const result = await getUserProject({
      projectId: "not-a-valid-uuid",
      userId: USER_ID,
    });

    expect(result).toBeNull();

    // Invalid input should be rejected before a database query is built.
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it("returns the project when the database query finds an accessible project", async () => {
    const result = await getUserProject({
      projectId: PROJECT_ID,
      userId: USER_ID,
    });

    expect(result).toEqual(mockProject);

    // Verify that the query starts from the project table.
    expect(mocks.select).toHaveBeenCalledTimes(1);
    expect(mocks.from).toHaveBeenCalledWith(project);

    // Verify that both membership relationships are part of the query.
    expect(mocks.innerJoin).toHaveBeenCalledWith(
      workspaceMember,
      expect.anything(),
    );

    expect(mocks.leftJoin).toHaveBeenCalledWith(
      projectMember,
      expect.anything(),
    );

    expect(mocks.where).toHaveBeenCalledWith(expect.anything());
    expect(mocks.limit).toHaveBeenCalledWith(1);
  });

  it("returns null when the query finds no accessible project", async () => {
    mocks.limit.mockResolvedValue([]);

    const result = await getUserProject({
      projectId: PROJECT_ID,
      userId: USER_ID,
    });

    expect(result).toBeNull();
  });

  it("propagates database errors to the caller", async () => {
    mocks.limit.mockRejectedValue(new Error("Database connection failed"));

    await expect(
      getUserProject({
        projectId: PROJECT_ID,
        userId: USER_ID,
      }),
    ).rejects.toThrow("Database connection failed");
  });
});
