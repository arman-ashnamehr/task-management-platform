/**Calling betterAuth() creates our configured authentication instance.
 * This instance is what other parts of our application will use to communicate with the authentication system. */
import { betterAuth } from "better-auth";
/**This is the bridge between Better Auth and Drizzle. */
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "@/lib/db";

/** db = our configured drizzle instance. provider = the database dialect used by the adapter. */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  //This activates email/password authentication.
  emailAndPassword: {
    enabled: true,
  },
});
//This is our initial authentication configuration

// We will use the Better Auth CLI rather than manually writing authentication tables.
// This is important because fields, indexes, and constraints must match the installed Better Auth version.
// The CLI supports generating Drizzle schema without requiring the database connection for the generation step.
// Then we should run this commands to generate Auth tables:
// npx auth@latest generate --adapter drizzle --dialect postgresql --output src/lib/db/schema/auth.ts --config src/lib/auth/auth.ts
