import { beforeEach, describe, expect, it, vi } from "vitest";
import { workspace, workspaceMember } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { createWorkspaceAction } from "./create-workspace";

//1- First we need to substitute the transaction and getsession with mock functions of Vitest.
vi.mock("@/lib/db", () => ({
  db: {
    transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));
//2- Test Fixtures & Fake Drizzle Query Chain
const mockWorkspace = {
  id: "workspace-123",
  name: "Acme Studio",
  slug: "acme-studio",
};

const mockSession = {
  user: {
    id: "user-123",
  },
};

const mockReturning = vi.fn();

const mockOnConflictDoNothing = vi.fn(() => ({
  returning: mockReturning,
}));

//branches based on what you pass to .values(...)
const mockValues = vi.fn((values: Record<string, unknown>) => {
  // Workspace insertion returns a query builder.
  if ("slug" in values) {
    return {
      onConflictDoNothing: mockOnConflictDoNothing,
    };
  }

  // Owner membership insertion is awaited directly.
  return Promise.resolve();
});

const mockInsert = vi.fn(() => ({
  values: mockValues,
}));
//mockTransactionClient stands in for tx inside db.transaction(async (tx) => ...).
const mockTransactionClient = {
  insert: mockInsert,
};

function createFormData(name: string) {
  const formData = new FormData();
  formData.set("name", name);
  return formData;
}

describe("createWorkspaceAction", () => {
  //Resetting & Wiring Defaults Before Every Test
  beforeEach(() => {
    vi.clearAllMocks();
    //By default, pretend a user (user-123) is logged in. vi.mocked(...) + as Awaited<ReturnType<...>> simply
    // keeps TypeScript happy about the mocked return type.
    vi.mocked(getSession).mockResolvedValue(
      mockSession as Awaited<ReturnType<typeof getSession>>,
    );
    //Re-attaches the default implementation of mockValues (because vi.clearAllMocks() clears call counts,
    // and re-setting implementations here guarantees a clean baseline).
    mockValues.mockImplementation((values: Record<string, unknown>) => {
      if ("slug" in values) {
        return {
          onConflictDoNothing: mockOnConflictDoNothing,
        };
      }

      return Promise.resolve();
    });
    mockReturning.mockReset();
    mockReturning.mockResolvedValue([mockWorkspace]);
    mockReturning.mockResolvedValue([mockWorkspace]);
    //When createWorkspaceAction calls db.transaction(async (tx) => { ... }), this fake implementation
    // immediately runs your callback and passes mockTransactionClient as tx.
    vi.mocked(db.transaction).mockImplementation(
      async (callback) => callback(mockTransactionClient as never) as never,
    );
  });

  // There are 6 Test Cases (it(...))----------------------------------------------------------------------------------------

  it("returns an error when the user is not authenticated", async () => {
    //Overrides getSession to return null (logged out).
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await createWorkspaceAction(createFormData("Acme Studio"));

    expect(result).toEqual({
      success: false,
      message: "You must be signed in to create a workspace.",
    });
    //Checks that it returns the expected failure object and never starts a DB transaction (not.toHaveBeenCalled()).
    expect(db.transaction).not.toHaveBeenCalled();
  });

  //Test 2: Invalid Workspace Name (Validation)
  it("returns validation errors when the workspace name is invalid", async () => {
    const result = await createWorkspaceAction(createFormData(" "));

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.fieldErrors?.name).toContain(
        "Workspace name must be at least 2 characters.",
      );
    }
    //Confirms db.transaction was not called because validation failed before touching the DB.
    expect(db.transaction).not.toHaveBeenCalled();
  });

  //Test 3: Happy Path (Create Workspace + Assign Owner)
  it("creates a workspace and assigns the user as its owner", async () => {
    const result = await createWorkspaceAction(createFormData("Acme Studio"));

    expect(result).toEqual({
      success: true,
      workspace: mockWorkspace,
    });
    //Confirms db.transaction ran once.
    expect(db.transaction).toHaveBeenCalledTimes(1);

    // The first insert creates the workspace.
    expect(mockInsert).toHaveBeenNthCalledWith(1, workspace);

    // The second insert creates the owner membership.
    expect(mockInsert).toHaveBeenNthCalledWith(2, workspaceMember);

    //Checks that the final .values(...) call inserted the owner membership with workspaceId, userId, and role: "OWNER".
    expect(mockValues).toHaveBeenLastCalledWith({
      workspaceId: mockWorkspace.id,
      userId: mockSession.user.id,
      role: "OWNER",
    });
  });
  //Test 4: Slug Collision Retry (acme-studio -> acme-studio-2)
  it("tries another slug when the base slug already exists", async () => {
    //mockResolvedValueOnce([]) simulates the first insert hitting onConflictDoNothing
    // (slug "acme-studio" already taken, so nothing returned).
    //mockResolvedValueOnce([mockWorkspace]) simulates the second insert succeeding.
    mockReturning
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockWorkspace]);

    const result = await createWorkspaceAction(createFormData("Acme Studio"));

    expect(result.success).toBe(true);

    //Asserts mockValues was called first with "acme-studio", then with "acme-studio-2", and mockReturning was called 2 times total.
    expect(mockValues).toHaveBeenNthCalledWith(1, {
      name: "Acme Studio",
      slug: "acme-studio",
    });

    expect(mockValues).toHaveBeenNthCalledWith(2, {
      name: "Acme Studio",
      slug: "acme-studio-2",
    });

    expect(mockReturning).toHaveBeenCalledTimes(2);
  });
  //Test 5: Exhausting All Slug Attempts (100 tries)
  it("returns a generic error when no slug is available after all attempts", async () => {
    //Forces mockReturning to always return [] (every slug candidate is taken).
    mockReturning.mockResolvedValue([]);

    const result = await createWorkspaceAction(createFormData("Acme Studio"));

    expect(result).toEqual({
      success: false,
      message: "We couldn't create your workspace. Please try again.",
    });

    expect(mockReturning).toHaveBeenCalledTimes(100);

    // No owner membership should be attempted.
    expect(mockInsert).toHaveBeenCalledTimes(100);
  });
  it("returns an error when owner membership creation fails", async () => {
    mockValues
      .mockImplementationOnce(() => ({
        onConflictDoNothing: mockOnConflictDoNothing,
      }))
      .mockImplementationOnce(() =>
        Promise.reject(new Error("Database insertion failed.")),
      );

    const result = await createWorkspaceAction(createFormData("Acme Studio"));

    expect(result).toEqual({
      success: false,
      message: "We couldn't create your workspace. Please try again.",
    });

    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});
