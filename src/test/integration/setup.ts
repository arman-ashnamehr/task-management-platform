import { config } from "dotenv";

// Load the integration-test environment file.
config({ path: ".env.test.local" });

const testDatabaseUrl = process.env.TASKFLOW_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "TASKFLOW_TEST_DATABASE_URL is missing. Check your .env.test.local file.",
  );
}

let databaseName: string;

try {
  const parsedUrl = new URL(testDatabaseUrl);
  databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
} catch {
  throw new Error("TASKFLOW_TEST_DATABASE_URL is not a valid database URL.");
}

// Fail closed: integration tests must never use the development database.
if (databaseName !== "taskflow_test") {
  throw new Error(
    `Unsafe integration-test database: "${databaseName}". Expected "taskflow_test".`,
  );
}

// The existing Drizzle connection reads DATABASE_URL.
process.env.DATABASE_URL = testDatabaseUrl;
