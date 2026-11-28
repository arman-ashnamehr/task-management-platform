import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getUserProject: vi.fn(),

  select: vi.fn(),
  selectFrom: vi.fn(),
  selectWhere: vi.fn(),
  selectLimit: vi.fn(),

  insert: vi.fn(),
  insertValues: vi.fn(),
  insertOnConflictDoNothing: vi.fn(),
  insertReturning: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/features/projects/queries/get-user-project", () => ({
  getUserProject: mocks.getUserProject,
}));

import { addProjectMemberAction } from "./add-project-member";

const projectId = "123e4567-e89b-12d3-a456-426614174000";
const actorId = "actor-user-id";
const targetUserId = "target-user-id";

const projectAccess = {
  id: projectId,
  workspaceId: "workspace-id",
  workspaceRole: "OWNER" as const,
  projectRole: null,
};

const insertedMember = {
  id: "membership-id",
  userId: targetUserId,
  role: "MEMBER" as const,
};

function createFormData(userId = targetUserId, role = "MEMBER") {
  const formData = new FormData();
  formData.set("userId", userId);
  formData.set("role", role);

  return formData;
}

describe("addProjectMemberAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Configure the mocked SELECT query chain.
    mocks.select.mockReturnValue({
      from: mocks.selectFrom,
    });

    mocks.selectFrom.mockReturnValue({
      where: mocks.selectWhere,
    });

    mocks.selectWhere.mockReturnValue({
      limit: mocks.selectLimit,
    });

    mocks.selectLimit.mockResolvedValue([
      {
        userId: targetUserId,
        role: "MEMBER",
      },
    ]);

    // Configure the mocked INSERT query chain.
    mocks.insert.mockReturnValue({
      values: mocks.insertValues,
    });

    mocks.insertValues.mockReturnValue({
      onConflictDoNothing: mocks.insertOnConflictDoNothing,
    });

    mocks.insertOnConflictDoNothing.mockReturnValue({
      returning: mocks.insertReturning,
    });

    mocks.insertReturning.mockResolvedValue([insertedMember]);

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

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);
    expect(mocks.getUserProject).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid project ID", async () => {
    const result = await addProjectMemberAction(
      createFormData(),
      "invalid-project-id",
    );

    expect(result.success).toBe(false);
    expect(mocks.getUserProject).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an empty target user ID", async () => {
    const result = await addProjectMemberAction(createFormData(""), projectId);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors?.userId).toBeDefined();
    }

    expect(mocks.getUserProject).not.toHaveBeenCalled();
  });

  it("rejects an invalid project role", async () => {
    const result = await addProjectMemberAction(
      createFormData(targetUserId, "ADMIN"),
      projectId,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors?.role).toBeDefined();
    }

    expect(mocks.getUserProject).not.toHaveBeenCalled();
  });

  it("rejects a user without project access", async () => {
    mocks.getUserProject.mockResolvedValue(null);

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a Project MEMBER trying to add another member", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MEMBER",
    });

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("prevents a Project MANAGER from assigning the MANAGER role", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MANAGER",
    });

    const result = await addProjectMemberAction(
      createFormData(targetUserId, "MANAGER"),
      projectId,
    );

    expect(result.success).toBe(false);
    expect(mocks.select).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a target user who is not a workspace member", async () => {
    mocks.selectLimit.mockResolvedValue([]);

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a target user who is already a workspace administrator", async () => {
    mocks.selectLimit.mockResolvedValue([
      {
        userId: targetUserId,
        role: "ADMIN",
      },
    ]);

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an existing project member", async () => {
    mocks.insertReturning.mockResolvedValue([]);

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.message).toContain("already a member");
    }
  });

  it("allows a Workspace OWNER to add a project MEMBER", async () => {
    const result = await addProjectMemberAction(
      createFormData(targetUserId, "MEMBER"),
      projectId,
    );

    expect(result).toEqual({
      success: true,
      member: insertedMember,
    });

    expect(mocks.insert).toHaveBeenCalled();
  });

  it("allows a Workspace ADMIN to add a project MANAGER", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "ADMIN",
    });

    mocks.insertReturning.mockResolvedValue([
      {
        ...insertedMember,
        role: "MANAGER",
      },
    ]);

    const result = await addProjectMemberAction(
      createFormData(targetUserId, "MANAGER"),
      projectId,
    );

    expect(result.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalled();
  });

  it("allows a Project MANAGER to add a project MEMBER", async () => {
    mocks.getUserProject.mockResolvedValue({
      ...projectAccess,
      workspaceRole: "MEMBER",
      projectRole: "MANAGER",
    });

    const result = await addProjectMemberAction(
      createFormData(targetUserId, "MEMBER"),
      projectId,
    );

    expect(result.success).toEqual(true);
    expect(mocks.insert).toHaveBeenCalled();
  });

  it("returns a generic error when the database operation fails", async () => {
    mocks.selectLimit.mockRejectedValue(
      new Error("Database connection details"),
    );

    const result = await addProjectMemberAction(createFormData(), projectId);

    expect(result).toEqual({
      success: false,
      message: "We couldn't add this project member. Please try again.",
    });

    // Internal database details must not be exposed to the client.
    expect(JSON.stringify(result)).not.toContain("Database connection details");
  });
});
