import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUserProject: vi.fn(),

  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  selectLimit: vi.fn(),

  delete: vi.fn(),
  deleteWhere: vi.fn(),
  deleteReturning: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.select,
    delete: mocks.delete,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/features/projects/queries/get-user-project", () => ({
  getUserProject: mocks.getUserProject,
}));

import { removeProjectMemberAction } from "./remove-project-member";

const projectId = "123e4567-e89b-12d3-a456-426614174000";
const actorId = "actor-user-id";
const targetUserId = "target-user-id";

const projectAccess = {
  id: projectId,
  workspaceId: "workspace-id",
  workspaceRole: "OWNER" as const,
  projectRole: null,
};

const targetMembership = {
  id: "membership-id",
  userId: targetUserId,
  role: "MEMBER" as const,
};

const deletedMember = {
  id: "membership-id",
  userId: targetUserId,
  role: "MEMBER" as const,
};

describe("removeProjectMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // SELECT query chain.
    mocks.select.mockReturnValue({
      from: mocks.selectFrom,
    });

    mocks.selectFrom.mockReturnValue({
      where: mocks.selectWhere,
    });

    mocks.selectWhere.mockReturnValue({
      limit: mocks.selectLimit,
    });

    mocks.selectLimit.mockResolvedValue([targetMembership]);

    // DELETE query chain.
    mocks.delete.mockReturnValue({
      where: mocks.deleteWhere,
    });

    mocks.deleteWhere.mockReturnValue({
      returning: mocks.deleteReturning,
    });

    mocks.deleteReturning.mockResolvedValue([deletedMember]);

    // Default authenticated actor and project access.
    mocks.getSession.mockResolvedValue({
      user: {
        id: actorId,
      },
    });

    mocks.getUserProject.mockResolvedValue(projectAccess);
  });

  it("rejects an unauthenticated user", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result.success).toBe(false);
    expect(mocks.getUserProject).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects an invalid project ID", async () => {
    const result = await removeProjectMemberAction(
      "invalid-project-id",
      targetUserId,
    );

    expect(result.success).toBe(false);
    expect(mocks.getUserProject).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects an empty target user ID", async () => {
    const result = await removeProjectMemberAction(projectId, "   ");

    expect(result.success).toBe(false);
    expect(mocks.getUserProject).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects a user without project access", async () => {
    mocks.getUserProject.mockResolvedValue(null);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result.success).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects a Project MEMBER trying to remove another member", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MEMBER",
    });

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result.success).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("rejects a target who is not a project member", async () => {
    mocks.selectLimit.mockResolvedValue([]);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result.success).toBe(false);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("prevents a Project MANAGER from removing another MANAGER", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MANAGER",
    });

    mocks.selectLimit.mockResolvedValue([
      {
        ...targetMembership,
        role: "MANAGER",
      },
    ]);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result.success).toBe(false);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("allows a Project MANAGER to remove a project MEMBER", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MANAGER",
    });

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result).toEqual({
      success: true,
      member: deletedMember,
    });

    expect(mocks.delete).toHaveBeenCalled();
  });

  it("allows a Workspace OWNER to remove a project MANAGER", async () => {
    mocks.selectLimit.mockResolvedValue([
      {
        ...targetMembership,
        role: "MANAGER",
      },
    ]);

    mocks.deleteReturning.mockResolvedValue([
      {
        ...deletedMember,
        role: "MANAGER",
      },
    ]);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result).toEqual({
      success: true,
      member: {
        ...deletedMember,
        role: "MANAGER",
      },
    });

    expect(mocks.delete).toHaveBeenCalled();
  });

  it("handles a membership that cannot be deleted", async () => {
    mocks.deleteReturning.mockResolvedValue([]);

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result).toEqual({
      success: false,
      message: "The membership changed or can no longer be removed.",
    });
  });

  it("returns a generic error when the database operation fails", async () => {
    mocks.selectLimit.mockRejectedValue(
      new Error("Database connection details"),
    );

    const result = await removeProjectMemberAction(projectId, targetUserId);

    expect(result).toEqual({
      success: false,
      message: "We couldn't remove this project member. Please try again.",
    });

    expect(JSON.stringify(result)).not.toContain("Database connection details");
  });
});
