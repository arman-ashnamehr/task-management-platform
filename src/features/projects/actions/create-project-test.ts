import { beforeEach, describe, expect, it, vi } from "vitest";

import { project } from "@/lib/db/schema";

import { createProjectAction } from "./create-project";

const {
  mockGetSession,
  mockGetUserWorkspace,
  mockInsert,
  mockValues,
  mockReturning,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockGetUserWorkspace: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/features/workspaces/queries/get-user-workspace", () => ({
  getUserWorkspace: mockGetUserWorkspace,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: mockInsert,
  },
}));

const USER_ID = "user-123";

const WORKSPACE_ID = "123e4567-e89b-12d3-a456-426614174000";

const PROJECT_ID = "223e4567-e89b-12d3-a456-426614174000";

const mockProject = {
  id: PROJECT_ID,
  workspaceId: WORKSPACE_ID,
  name: "TaskFlow",
  description: null,
};

function createFormData(name: string, description?: string): FormData {
  const formData = new FormData();

  formData.set("name", name);

  if (description !== undefined) {
    formData.set("description", description);
  }

  return formData;
}

describe("createProjectAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSession.mockResolvedValue({
      user: {
        id: USER_ID,
      },
    });

    mockGetUserWorkspace.mockResolvedValue({
      id: WORKSPACE_ID,
      name: "TaskFlow Workspace",
      slug: "taskflow-workspace",
      role: "OWNER",
      joinedAt: new Date(),
    });

    // Simulate the Drizzle insert().values().returning() chain.
    mockInsert.mockReturnValue({
      values: mockValues,
    });

    mockValues.mockReturnValue({
      returning: mockReturning,
    });

    mockReturning.mockResolvedValue([mockProject]);
  });

  it("rejects unauthenticated users", async () => {
    mockGetSession.mockResolvedValue(null);

    const result = await createProjectAction(
      createFormData("TaskFlow"),
      WORKSPACE_ID,
    );

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to create a project.",
    });

    expect(mockGetUserWorkspace).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid workspace ID", async () => {
    const result = await createProjectAction(
      createFormData("TaskFlow"),
      "invalid-id",
    );

    expect(result).toEqual({
      success: false,
      message: "Invalid workspace.",
    });

    expect(mockGetUserWorkspace).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects users who are not workspace members", async () => {
    mockGetUserWorkspace.mockResolvedValue(null);

    const result = await createProjectAction(
      createFormData("TaskFlow"),
      WORKSPACE_ID,
    );

    expect(result).toEqual({
      success: false,
      message: "Workspace not found.",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects workspace members without project creation permission", async () => {
    mockGetUserWorkspace.mockResolvedValue({
      id: WORKSPACE_ID,
      name: "TaskFlow Workspace",
      slug: "taskflow-workspace",
      role: "MEMBER",
      joinedAt: new Date(),
    });

    const result = await createProjectAction(
      createFormData("TaskFlow"),
      WORKSPACE_ID,
    );

    expect(result).toEqual({
      success: false,
      message: "You don't have permission to create projects.",
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects an invalid project name", async () => {
    const result = await createProjectAction(createFormData("A"), WORKSPACE_ID);

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors?.name).toContain(
        "Project name must be at least 2 characters.",
      );
    }

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("rejects a description longer than 500 characters", async () => {
    const result = await createProjectAction(
      createFormData("TaskFlow", "A".repeat(501)),
      WORKSPACE_ID,
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors?.description).toContain(
        "Project description cannot exceed 500 characters.",
      );
    }

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it.each(["OWNER", "ADMIN"] as const)(
    "allows a workspace %s to create a project",
    async (role) => {
      mockGetUserWorkspace.mockResolvedValue({
        id: WORKSPACE_ID,
        name: "TaskFlow Workspace",
        slug: "taskflow-workspace",
        role,
        joinedAt: new Date(),
      });

      const result = await createProjectAction(
        createFormData("TaskFlow"),
        WORKSPACE_ID,
      );

      expect(result).toEqual({
        success: true,
        project: mockProject,
      });

      expect(mockInsert).toHaveBeenCalledWith(project);

      expect(mockValues).toHaveBeenCalledWith({
        workspaceId: WORKSPACE_ID,
        name: "TaskFlow",
        description: null,
      });

      expect(mockGetUserWorkspace).toHaveBeenCalledWith({
        workspaceId: WORKSPACE_ID,
        userId: USER_ID,
      });
    },
  );

  it("creates a project with a description", async () => {
    const projectWithDescription = {
      ...mockProject,
      description: "A task management project.",
    };

    mockReturning.mockResolvedValue([projectWithDescription]);

    const result = await createProjectAction(
      createFormData("TaskFlow", "A task management project."),
      WORKSPACE_ID,
    );

    expect(result).toEqual({
      success: true,
      project: projectWithDescription,
    });

    expect(mockValues).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      name: "TaskFlow",
      description: "A task management project.",
    });
  });

  it("returns a generic error when database insertion fails", async () => {
    mockReturning.mockRejectedValue(new Error("Database connection failed"));

    const result = await createProjectAction(
      createFormData("TaskFlow"),
      WORKSPACE_ID,
    );

    expect(result).toEqual({
      success: false,
      message: "We couldn't create your project. Please try again.",
    });
  });
});
