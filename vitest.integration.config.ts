import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],

  test: {
    // Only discover integration tests in this configuration.
    include: ["src/**/*.integration.test.ts"],

    // Integration tests run in Node, not a browser environment.
    environment: "node",

    // Load and validate the test database connection before test files.
    setupFiles: ["./src/test/integration/setup.ts"],

    // Avoid concurrent tests modifying shared database records.
    fileParallelism: false,

    testTimeout: 15_000,
    hookTimeout: 15_000,
  },
});
