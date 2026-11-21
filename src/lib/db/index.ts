import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}
// Creates a postgreSQL client using the postgres driver
//The max: 10 configures a connection pool with a maximum of 10 connections for this client instance.
const client = postgres(connectionString, { max: 10 });

//Wraps the PostgreSQL client with Drizzle's query and ORM APIs.

//The db instance is what our application code will use to interact with PostgreSQL.
export const db = drizzle(client, { schema });
