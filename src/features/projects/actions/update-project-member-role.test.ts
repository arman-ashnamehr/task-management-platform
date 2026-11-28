import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSession } from "@/lib/auth/session";
import { getUserProject } from "@/features/projects/queries/get-user-project";
import { updateProjectMemberRoleAction } from "./update-project-member-role";

// Create mock functions before importing the modules that use them.
const { updateMock, updateSetMock, updateWhereMock, updateReturningMock } =
  vi.hoisted(() => ({
    updateMock: vi.fn(),
    updateSetMock: vi.fn(),
    updateWhereMock: vi.fn(),
    updateReturningMock: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({
  db: {
    update: updateMock,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/features/projects/queries/get-user-project", () => ({
  getUserProject: vi.fn(),
}));

const mockedGetSession = vi.mocked(getSession);
const mockedGetUserProject = vi.mocked(getUserProject);

const PROJECT_ID = "550e8400-e29b-41d4-a716-446655440000";
const TARGET_USER_ID = "target-user-123";
const ACTOR_USER_ID = "actor-user-456";

describe("updateProjectMemberRoleAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configure the Drizzle UPDATE query-builder chain.
    updateMock.mockReturnValue({
      set: updateSetMock,
    });

    updateSetMock.mockReturnValue({
      where: updateWhereMock,
    });

    updateWhereMock.mockReturnValue({
      returning: updateReturningMock,
    });

    // Default authenticated session.
    mockedGetSession.mockResolvedValue({
      user: {
        id: ACTOR_USER_ID,
      },
    } as Awaited<ReturnType<typeof getSession>>);

    // Default actor: Workspace OWNER.
    mockedGetUserProject.mockResolvedValue({
      workspaceRole: "OWNER",
      projectRole: null,
    } as Awaited<ReturnType<typeof getUserProject>>);
  });

  it("returns an error when the user is not authenticated", async () => {
    mockedGetSession.mockResolvedValue(null);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to change project member roles.",
    });

    expect(mockedGetUserProject).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid project ID", async () => {
    const result = await updateProjectMemberRoleAction(
      "invalid-project-id",
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result.success).toBe(false);
    expect(mockedGetUserProject).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an empty target user ID", async () => {
    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      "   ",
      "MANAGER",
    );

    expect(result.success).toBe(false);
    expect(mockedGetUserProject).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects an unsupported role", async () => {
    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "OWNER",
    );

    expect(result.success).toBe(false);
    expect(mockedGetUserProject).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns an error when the actor cannot access the project", async () => {
    mockedGetUserProject.mockResolvedValue(null);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: false,
      message: "Project not found.",
    });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("prevents a Project Manager from changing another member's role", async () => {
    mockedGetUserProject.mockResolvedValue({
      workspaceRole: "MEMBER",
      projectRole: "MANAGER",
    } as Awaited<ReturnType<typeof getUserProject>>);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: false,
      message: "Only workspace administrators can change project member roles.",
    });

    expect(updateMock).not.toHaveBeenCalled();
  });

  it("prevents a regular Project Member from changing roles", async () => {
    mockedGetUserProject.mockResolvedValue({
      workspaceRole: "MEMBER",
      projectRole: "MEMBER",
    } as Awaited<ReturnType<typeof getUserProject>>);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result.success).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("allows a Workspace OWNER to promote a member to MANAGER", async () => {
    const updatedMember = {
      id: "membership-123",
      userId: TARGET_USER_ID,
      role: "MANAGER" as const,
    };

    updateReturningMock.mockResolvedValue([updatedMember]);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: true,
      member: updatedMember,
    });

    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateSetMock).toHaveBeenCalledWith({
      role: "MANAGER",
    });
  });

  it("allows a Workspace ADMIN to demote a manager to MEMBER", async () => {
    mockedGetUserProject.mockResolvedValue({
      workspaceRole: "ADMIN",
      projectRole: null,
    } as Awaited<ReturnType<typeof getUserProject>>);

    const updatedMember = {
      id: "membership-456",
      userId: TARGET_USER_ID,
      role: "MEMBER" as const,
    };

    updateReturningMock.mockResolvedValue([updatedMember]);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MEMBER",
    );

    expect(result).toEqual({
      success: true,
      member: updatedMember,
    });

    expect(updateSetMock).toHaveBeenCalledWith({
      role: "MEMBER",
    });
  });

  it("returns an error when the target is not a project member", async () => {
    updateReturningMock.mockResolvedValue([]);

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: false,
      message: "This user is not a member of the project.",
    });
  });

  it("returns a generic error when the database update fails", async () => {
    updateMock.mockImplementation(() => {
      throw new Error("Database connection failed");
    });

    const result = await updateProjectMemberRoleAction(
      PROJECT_ID,
      TARGET_USER_ID,
      "MANAGER",
    );

    expect(result).toEqual({
      success: false,
      message:
        "We couldn't update this project member's role. Please try again.",
    });
  });
});
