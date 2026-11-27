import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";

import { db } from "@/lib/db";

describe("Integration test database connection", () => {
  it("connects to the taskflow_test database", async () => {
    const result = await db.execute<{ database_name: string }>(
      sql`SELECT current_database() AS database_name`,
    );

    expect(result[0]?.database_name).toBe("taskflow_test");
  });
});
