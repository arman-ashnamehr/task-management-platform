import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";

import { getUserProject } from "./get-user-project";
import { db } from "@/lib/db";
import {
  project,
  projectMember,
  user,
  workspace,
  workspaceMember,
} from "@/lib/db/schema";

/**beforeAll() creates the users, workspace, memberships, and project before the tests execute.
         afterAll() removes the test workspace and users after the tests finish. */
// Generate unique IDs so this test never collides with previous test runs.
const userIds = {
  owner: `integration-owner-${randomUUID()}`,
  admin: `integration-admin-${randomUUID()}`,
  manager: `integration-manager-${randomUUID()}`,
  member: `integration-member-${randomUUID()}`,
  workspaceOnly: `integration-workspace-only-${randomUUID()}`,
  outsider: `integration-outsider-${randomUUID()}`,
};

let workspaceId: string;
let projectId: string;

describe("getUserProject integration tests", () => {
  beforeAll(async () => {
    // 1. Create six real users.
    await db.insert(user).values([
      {
        id: userIds.owner,
        name: "Integration Owner",
        email: `${userIds.owner}@example.com`,
      },
      {
        id: userIds.admin,
        name: "Integration Admin",
        email: `${userIds.admin}@example.com`,
      },
      {
        id: userIds.manager,
        name: "Integration Manager",
        email: `${userIds.manager}@example.com`,
      },
      {
        id: userIds.member,
        name: "Integration Member",
        email: `${userIds.member}@example.com`,
      },
      {
        id: userIds.workspaceOnly,
        name: "Workspace Only Member",
        email: `${userIds.workspaceOnly}@example.com`,
      },
      {
        id: userIds.outsider,
        name: "Integration Outsider",
        email: `${userIds.outsider}@example.com`,
      },
    ]);

    // 2. Create one workspace.
    const [createdWorkspace] = await db
      .insert(workspace)
      .values({
        name: "Integration Test Workspace",
        slug: `integration-${randomUUID()}`,
      })
      .returning({
        id: workspace.id,
      });

    if (!createdWorkspace) {
      throw new Error("Failed to create integration-test workspace.");
    }

    workspaceId = createdWorkspace.id;

    // 3. Add five users to the workspace.
    // The outsider deliberately receives no workspace membership.
    await db.insert(workspaceMember).values([
      {
        workspaceId,
        userId: userIds.owner,
        role: "OWNER",
      },
      {
        workspaceId,
        userId: userIds.admin,
        role: "ADMIN",
      },
      {
        workspaceId,
        userId: userIds.manager,
        role: "MEMBER",
      },
      {
        workspaceId,
        userId: userIds.member,
        role: "MEMBER",
      },
      {
        workspaceId,
        userId: userIds.workspaceOnly,
        role: "MEMBER",
      },
    ]);

    // 4. Create one project inside the workspace.
    const [createdProject] = await db
      .insert(project)
      .values({
        workspaceId,
        name: "Integration Test Project",
        description: "A project used to verify access control.",
      })
      .returning({
        id: project.id,
      });

    if (!createdProject) {
      throw new Error("Failed to create integration-test project.");
    }

    projectId = createdProject.id;

    // 5. Give two workspace members explicit project membership.
    await db.insert(projectMember).values([
      {
        projectId,
        workspaceId,
        userId: userIds.manager,
        role: "MANAGER",
      },
      {
        projectId,
        workspaceId,
        userId: userIds.member,
        role: "MEMBER",
      },
    ]);
  });

  afterAll(async () => {
    // Deleting the workspace cascades to its memberships and projects.
    if (workspaceId) {
      await db.delete(workspace).where(eq(workspace.id, workspaceId));
    }

    // Delete only the users created by this test.
    await db.delete(user).where(inArray(user.id, Object.values(userIds)));
  });

  it("allows a workspace OWNER to access the project", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.owner,
    });

    expect(result).not.toBeNull();
    expect(result?.workspaceRole).toBe("OWNER");
    expect(result?.projectRole).toBeNull();
  });

  it("allows a workspace ADMIN to access the project", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.admin,
    });

    expect(result).not.toBeNull();
    expect(result?.workspaceRole).toBe("ADMIN");
    expect(result?.projectRole).toBeNull();
  });

  it("allows a project MANAGER to access the project", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.manager,
    });

    expect(result).not.toBeNull();
    expect(result?.workspaceRole).toBe("MEMBER");
    expect(result?.projectRole).toBe("MANAGER");
  });

  it("allows a project MEMBER to access the project", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.member,
    });

    expect(result).not.toBeNull();
    expect(result?.workspaceRole).toBe("MEMBER");
    expect(result?.projectRole).toBe("MEMBER");
  });

  it("denies a workspace MEMBER without project membership", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.workspaceOnly,
    });

    expect(result).toBeNull();
  });

  it("denies a user who is not a workspace member", async () => {
    const result = await getUserProject({
      projectId,
      userId: userIds.outsider,
    });

    expect(result).toBeNull();
  });

  it("returns null for a project that does not exist", async () => {
    const result = await getUserProject({
      projectId: randomUUID(),
      userId: userIds.owner,
    });

    expect(result).toBeNull();
  });
});
