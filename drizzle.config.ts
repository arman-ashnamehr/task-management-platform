import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Tells Drizzle Kit where our TypeScript schema definitions live.
  schema: "./src/lib/db/schema/index.ts",
  //Specifies the directory where migration files are generated.
  out: "./drizzle",
  //Tells Drizzle which database engine we are using. In our case, PostgreSQL.
  dialect: "postgresql",
  //Provides the connection credentials that Drizzle Kit uses when it needs to connect to PostgreSQL.
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    // ! == is TypeScript's non-null assertion operator. It tells the compiler that we expect this variable to exist.
  },
});
