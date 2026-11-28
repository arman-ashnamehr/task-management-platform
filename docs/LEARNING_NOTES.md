# TaskFlow — Learning Notes

> A practical learning journal documenting the concepts, architecture, implementation decisions, best practices, and troubleshooting lessons learned while building TaskFlow.
>
> **Project:** TaskFlow — Multi-tenant Task Management Platform  
> **Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, PostgreSQL, Drizzle ORM, Better Auth, Zod, React Hook Form, Vitest, React Testing Library, Playwright  
> **Purpose:** Learn modern full-stack development by building a realistic application.

---

# Table of Contents

1. [Project Overview and Development Philosophy](#1-project-overview-and-development-philosophy)
2. [Development Environment and Project Setup](#2-development-environment-and-project-setup)
3. [Next.js and React Architecture](#3-nextjs-and-react-architecture)
4. [Feature-Based Project Structure](#4-feature-based-project-structure)
5. [TypeScript Principles](#5-typescript-principles)
6. [Forms and Validation](#6-forms-and-validation)
7. [Authentication and Session Management](#7-authentication-and-session-management)
8. [PostgreSQL and Docker](#8-postgresql-and-docker)
9. [Drizzle ORM and Database Architecture](#9-drizzle-orm-and-database-architecture)
10. [Workspace Domain](#10-workspace-domain)
11. [Project Domain](#11-project-domain)
12. [Multi-Tenant Authorization and Security](#12-multi-tenant-authorization-and-security)
13. [Server Actions and Business Logic](#13-server-actions-and-business-logic)
14. [Testing Strategy](#14-testing-strategy)
15. [Git Workflow](#15-git-workflow)
16. [Important Troubleshooting Lessons](#16-important-troubleshooting-lessons)
17. [Architecture Decisions and Future Considerations](#17-architecture-decisions-and-future-considerations)
18. [Milestone Progress](#18-milestone-progress)
19. [Reusable Learning Template](#19-reusable-learning-template)

---

# 1. Project Overview and Development Philosophy

## 1.1 What are we building?

TaskFlow is a multi-tenant task-management application.

Users can create workspaces, create projects inside workspaces, collaborate with other users, and eventually manage tasks, comments, labels, and activity history.

The planned domain entities are:

- User
- Workspace
- WorkspaceMember
- Project
- ProjectMember
- Task
- Comment
- ActivityLog
- Label
- TaskLabel
- WorkspaceInvitation

The application is designed with real-world SaaS requirements in mind, particularly:

- Multi-tenant data isolation
- Role-based authorization
- Relational integrity
- Secure server-side operations
- Maintainable feature-oriented architecture
- Automated testing

## 1.2 Development philosophy

We follow this development cycle:

**Implement → Verify → Review → Commit → Push → Continue**

Each milestone should be completed and verified before starting the next one.

Important principles:

1. Prefer readable and maintainable code over clever code.
2. Understand why a solution works, not just how to copy it.
3. Use current React and Next.js APIs.
4. Avoid deprecated APIs and outdated patterns.
5. Validate all untrusted input on the server.
6. Never trust client-side authorization.
7. Enforce important relational rules in PostgreSQL.
8. Test business logic and security behavior.
9. Commit completed milestones regularly.

---

# 2. Development Environment and Project Setup

## 2.1 Environment

The development environment:

- Windows
- PowerShell
- Node.js v24
- npm v11
- Visual Studio Code
- Next.js App Router
- TypeScript
- PostgreSQL 18
- Docker and Docker Compose

Project directory:

```text
D:\Projects\nextLearning\task-managemenet-platform
```

## 2.2 Why use TypeScript?

TypeScript provides static type checking on top of JavaScript.

It helps detect problems before runtime, documents the expected structure of data, and makes larger applications easier to maintain.

For example:

```ts
type User = {
  id: string;
  name: string;
  email: string;
};

function greetUser(user: User): string {
  return `Hello, ${user.name}`;
}
```

The function clearly communicates the structure it expects.

TypeScript does not replace runtime validation. Data received from a browser, API, or external service must still be validated at runtime.

## 2.3 Environment variables

Database connection strings and authentication secrets belong in environment variables.

Example `.env`:

```dotenv
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3000"
```

Important:

- Never expose private secrets through `NEXT_PUBLIC_` variables.
- Never commit `.env` files.
- Keep production secrets outside source control.
- Use separate configuration for integration tests.

We also created `.env.test.local` for the integration-test database.

---

# 3. Next.js and React Architecture

## 3.1 App Router

TaskFlow uses the Next.js App Router.

The App Router organizes application routing through the filesystem.

For example:

```text
src/app/
├── page.tsx
├── layout.tsx
├── (auth)/
│   ├── login/
│   └── register/
└── (app)/
    ├── dashboard/
    └── workspace/
        └── [workspaceId]/
```

Important routing concepts:

- `page.tsx`: Defines a route's UI.
- `layout.tsx`: Defines a shared layout.
- `[workspaceId]`: Dynamic route segment.
- Route groups such as `(app)` organize routes without adding a URL segment.

## 3.2 Server Components and Client Components

Server Components are the default in the Next.js App Router.

A component becomes a Client Component when it uses the `"use client"` directive.

### Server Components

Use Server Components for:

- Initial page rendering
- Database queries
- Server-side authentication checks
- Accessing server-only resources
- Rendering content that does not require browser interaction

Example:

```tsx
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSession();

  return <h1>Welcome, {session?.user.name}</h1>;
}
```

### Client Components

Use Client Components when browser-side interaction is necessary:

- React state
- Event handlers
- Effects
- Browser APIs
- Interactive forms
- Client-side navigation state

Example:

```tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount((value) => value + 1)}>
      Count: {count}
    </button>
  );
}
```

### Important architectural lesson

A Server Component can render a Client Component without becoming a Client Component itself.

For example, `AppHeader` remains a Server Component even though it renders `UserMenu`, which is a Client Component.

This helps keep the client-side JavaScript bundle smaller.

A Client Component cannot directly import and execute a Server Component through its own client module graph. Instead, server-rendered components can be composed through props such as `children`.

## 3.3 Avoid unnecessary Client Components

Do not convert an entire page into a Client Component just because one small part needs interaction.

Instead, isolate the interactive part.

For example:

- Workspace detail page: Server Component.
- Add workspace member form: Client Component.
- Database query: Server-side function.
- Form submission: Server Action.

This separation keeps responsibilities clear.

## 3.4 Dynamic route parameters

In the current Next.js App Router pattern, dynamic route parameters are asynchronous.

Example:

```tsx
type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;

  return <div>{workspaceId}</div>;
}
```

Do not use outdated synchronous parameter typing in this project.

## 3.5 `useEffect` and `router.refresh`

We used `useEffect` after successful workspace creation:

```tsx
useEffect(() => {
  if (state.success) {
    router.refresh();
  }
}, [state, router]);
```

Why?

The form submits a Server Action. The action changes database state, but the currently rendered Server Component data may still represent the previous state.

`router.refresh()` requests a new server-rendered result for the current route.

This allows the dashboard to display the newly created workspace without requiring a full browser reload.

---

# 4. Feature-Based Project Structure

## 4.1 Why feature-based architecture?

We organize code by business functionality rather than putting every component or function into a large generic folder.

Current architectural direction:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (app)/
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
│
├── features/
│   ├── auth/
│   ├── workspaces/
│   ├── projects/
│   ├── tasks/
│   ├── comments/
│   └── members/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── lib/
│   ├── db/
│   ├── auth/
│   ├── validations/
│   └── utils/
│
└── types/
```

### `features/`

Contains functionality specific to a business domain.

For example:

```text
features/auth/
├── actions/
├── components/
└── ...
```

A password input used specifically by authentication forms belongs naturally in `features/auth/components`.

### `components/ui/`

Contains generic reusable UI elements.

Examples:

- Button
- Input
- Card
- Dialog
- Badge

These components should not know about workspaces, projects, or authentication.

### `components/layout/`

Contains shared application layout components.

Examples:

- AppHeader
- AppSidebar
- AppNavLink

### `lib/`

Contains infrastructure and cross-feature utilities.

Examples:

- Database connection
- Authentication configuration
- Validation schemas
- General utilities

## 4.2 A useful placement rule

Ask:

"Would this component still make sense if the authentication feature did not exist?"

If the answer is no, it probably belongs inside `features/auth`.

If it is a generic component that could be reused in multiple features, it may belong in `components/ui`.

Avoid moving components into shared folders simply because they are reusable in theory. Their actual responsibility matters.

---

# 5. TypeScript Principles

## 5.1 Type inference with Zod

We use Zod schemas as runtime validation and TypeScript type sources.

Example:

```ts
import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(50),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
```

This avoids maintaining a separate TypeScript type that could drift away from the validation schema.

## 5.2 Discriminated unions

We use discriminated unions for Server Action results.

Example:

```ts
type ActionResult =
  | {
      success: true;
      data: {
        id: string;
      };
    }
  | {
      success: false;
      message: string;
    };
```

The `success` property determines which result structure is available.

Usage:

```ts
if (result.success) {
  console.log(result.data.id);
} else {
  console.log(result.message);
}
```

TypeScript narrows the type automatically.

This is safer than returning loosely structured objects with many optional properties.

## 5.3 `Awaited` and `ReturnType`

We used this pattern for component props:

```ts
type WorkspaceCardProps = {
  workspace: Awaited<ReturnType<typeof getUserWorkspaces>>[number];
};
```

What does it mean?

- `ReturnType`: Gets a function's return type.
- `Awaited`: Resolves the type of a Promise.
- `[number]`: Extracts one element's type from an array.

This avoids manually duplicating database query result types.

## 5.4 `null` and `undefined`

These values have different meanings:

- `null`: Explicitly represents no value.
- `undefined`: Often represents a missing or uninitialized value.

For example:

```ts
const [workspace] = await db.select(...);
```

The first array element may be `undefined` if no record exists.

We often return:

```ts
return workspace ?? null;
```

This makes the function's absence behavior explicit.

## 5.5 Database IDs have different types

Important distinction:

- Better Auth user IDs are `text`.
- Workspace IDs are UUIDs.
- Project IDs are UUIDs.

Do not validate a Better Auth user ID with a UUID regular expression.

Only validate identifiers according to their actual database type.

---

# 6. Forms and Validation

## 6.1 React Hook Form

We use React Hook Form for interactive forms.

Its responsibilities include:

- Managing input values
- Tracking validation errors
- Tracking submission state
- Reducing unnecessary rendering
- Integrating with validation libraries

## 6.2 Zod

Zod validates data at runtime.

Example:

```ts
export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),

  description: z.string().trim().max(500).optional(),
});
```

### Why validate on the server if the form already validates?

Client-side validation improves user experience.

However, client-side validation can be bypassed by sending a custom request.

Therefore:

- Client validation improves usability.
- Server validation protects the application.

Both are necessary.

## 6.3 `safeParse`

We use:

```ts
const result = schema.safeParse(input);
```

Unlike `parse`, `safeParse` returns a result object instead of throwing a validation exception.

Successful result:

```ts
{
  success: true,
  data: ...
}
```

Failed result:

```ts
{
  success: false,
  error: ...
}
```

This is useful in Server Actions because validation failure is an expected outcome.

## 6.4 `useActionState`

We used React's `useActionState` for the workspace creation form.

Conceptually:

```tsx
const [state, formAction, isPending] = useActionState(action, initialState);
```

It provides:

- `state`: The latest action result.
- `formAction`: Function used as the form's action.
- `isPending`: Whether the action is currently executing.

The action receives previous state and form data:

```tsx
async (previousState, formData) => {
  return createWorkspaceAction(formData);
};
```

The previous state can be unused, but the parameter should still be typed correctly.

### `useActionState` versus `useState`

`useActionState` is useful when the state represents the result of a form action.

With `useState`, we would manually manage:

- Loading state
- Success state
- Error state
- Calling the action
- Resetting state

`useActionState` provides a more direct model for action-driven forms.

Use `useState` when the state is ordinary UI state rather than the result of a form action.

---

# 7. Authentication and Session Management

## 7.1 Why Better Auth?

We selected Better Auth for authentication.

The application uses:

- Email and password authentication
- PostgreSQL database storage
- Database-backed sessions
- Server-side session verification

## 7.2 Authentication versus authorization

These are different concepts.

**Authentication:** Who is the user?

**Authorization:** What is the user allowed to do?

A valid session proves the user's identity. It does not automatically grant access to every workspace or project.

## 7.3 Better Auth server configuration

The server-side configuration lives in:

```text
src/lib/auth/auth.ts
```

Basic configuration:

```ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";

import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },
});
```

The database adapter allows Better Auth to persist users, sessions, accounts, and verification records.

## 7.4 Better Auth API route

We created:

```text
src/app/api/auth/[...all]/route.ts
```

Implementation:

```ts
import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

This connects Better Auth's handlers to Next.js.

## 7.5 Client authentication

Client configuration:

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
```

The client handles interactive authentication operations.

However, client-side session information must not be the security authority for server operations.

## 7.6 Server-side session helper

We created:

```text
src/lib/auth/session.ts
```

Implementation:

```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
```

This helper obtains the request headers and asks Better Auth to verify the session.

The helper can be reused by Server Components, Server Actions, and other server-side functions.

## 7.7 Protecting application routes

The authenticated application layout checks the session:

```tsx
const session = await getSession();

if (!session) {
  redirect("/login");
}
```

This prevents unauthenticated users from accessing the protected application layout.

But a protected layout is not sufficient security for mutations.

Every Server Action and Route Handler must independently:

1. Authenticate the current user.
2. Validate the input.
3. Verify authorization.
4. Perform the operation.

## 7.8 Important security rule

Never trust a client-submitted `userId` to identify the person performing an operation.

The actor must always come from the authenticated session:

```ts
const session = await getSession();

const actorId = session.user.id;
```

A submitted `userId` may represent a target user, but it must not replace the authenticated actor's identity.

---

# 8. PostgreSQL and Docker

## 8.1 Why PostgreSQL?

PostgreSQL is our relational database.

TaskFlow contains relationships that benefit from relational integrity:

- Workspace has many members.
- Workspace has many projects.
- Project has many members.
- Project has many tasks.
- Task may have comments and labels.

PostgreSQL provides:

- Foreign keys
- Unique constraints
- Transactions
- Indexes
- Enums
- Relational joins

## 8.2 Docker Compose

We run PostgreSQL locally using Docker Compose.

The database service uses:

```yaml
services:
  db:
    image: postgres:18
    container_name: taskflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: taskflow
      POSTGRES_PASSWORD: taskflow_dev_password
      POSTGRES_DB: taskflow
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - taskflow_postgres_data:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow -d taskflow"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  taskflow_postgres_data:
```

The named volume preserves database data when the container is stopped or recreated.

The host binding to `127.0.0.1` restricts the published database port to the local machine.

## 8.3 Useful Docker commands

Start:

```powershell
docker compose up -d
```

Inspect:

```powershell
docker compose ps
docker ps
```

Stop:

```powershell
docker compose down
```

Connect to PostgreSQL:

```powershell
docker exec -it taskflow-postgres psql -U taskflow -d taskflow
```

## 8.4 SQL basics learned

Useful PostgreSQL commands:

```sql
SELECT current_database();
SELECT current_user;
SELECT version();

\l
\dt
\d workspace
```

`\l` lists databases.

`\dt` lists tables.

`\d table_name` describes a table.

---

# 9. Drizzle ORM and Database Architecture

## 9.1 Why Drizzle ORM?

Drizzle provides a TypeScript-oriented interface for working with relational databases.

We use it for:

- Defining database schemas
- Querying records
- Joining tables
- Creating migrations
- Working with transactions
- Keeping application types aligned with database structures

## 9.2 Database connection

Our database connection is configured in:

```text
src/lib/db/index.ts
```

Implementation:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const client = postgres(connectionString, {
  max: 10,
});

export const db = drizzle(client, {
  schema,
});
```

The connection string is validated before creating the database client.

## 9.3 Drizzle configuration

`drizzle.config.ts`:

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

The schema path tells Drizzle Kit where to find our schema definitions.

The output path determines where migration files are generated.

## 9.4 Migration workflow

We use migrations rather than treating schema synchronization as an informal manual operation.

Normal workflow:

```powershell
npm run db:generate
npm run db:migrate
```

The important steps are:

1. Change the Drizzle schema.
2. Generate a migration.
3. Review the generated SQL.
4. Apply the migration.
5. Verify the resulting PostgreSQL structure.
6. Commit the schema and migration together.

We avoid using `db:push` as our normal migration workflow because we want explicit, reviewable migration history.

## 9.5 Foreign keys

A foreign key ensures that a reference points to an existing record.

Example:

```ts
workspaceId: uuid("workspace_id")
  .notNull()
  .references(() => workspace.id, {
    onDelete: "cascade",
  }),
```

This means a workspace member must reference an existing workspace.

`onDelete: "cascade"` means deleting the workspace also deletes its dependent membership records.

## 9.6 Unique constraints

Example:

```ts
unique("workspace_member_workspace_user_unique").on(
  table.workspaceId,
  table.userId,
);
```

This guarantees that the same user cannot have multiple membership records in the same workspace.

Important principle:

**A check in application code is not a replacement for a database constraint.**

The application check improves error messages and user experience. The database constraint protects integrity under concurrency and unexpected requests.

## 9.7 Indexes

Indexes improve query performance for frequently searched columns.

Examples:

- `workspace_member.user_id`
- `project.workspace_id`
- `project_member.user_id`
- `tasks.project_id, status` (planned)

Indexes should be designed around real query patterns.

Too many indexes increase storage and write costs.

## 9.8 Transactions

A transaction groups multiple database operations into one logical operation.

Example:

```ts
const result = await db.transaction(async (tx) => {
  const workspace = await tx.insert(...).returning();

  await tx.insert(...);

  return workspace;
});
```

If an operation throws an error, the transaction is rolled back.

We used a transaction when creating a workspace because the workspace and its initial OWNER membership must be created together.

Without a transaction, a workspace could be created without its owner membership if the second operation failed.

A transaction does not automatically solve every concurrency problem. Unique constraints and appropriate isolation or locking strategies may still be necessary.

## 9.9 Drizzle `$onUpdate`

We used:

```ts
updatedAt: timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull(),
```

Important detail:

`$onUpdate` is an ORM-side behavior. It is not a PostgreSQL trigger.

A raw SQL update that bypasses Drizzle will not automatically execute this callback.

If database-wide update timestamp behavior becomes necessary, consider a PostgreSQL trigger.

---

# 10. Workspace Domain

## 10.1 Workspace schema

A workspace belongs to the application and is the primary tenant boundary.

Current table:

```text
workspace
├── id
├── name
├── slug
├── created_at
└── updated_at
```

Important design decisions:

- Workspace ID uses UUID.
- Workspace slug is globally unique.
- Workspace name is required.
- Workspace members are stored separately.

## 10.2 WorkspaceMember

The membership table represents the relationship between users and workspaces.

```text
workspace_member
├── id
├── workspace_id
├── user_id
├── role
└── joined_at
```

Workspace roles:

```ts
["OWNER", "ADMIN", "MEMBER"];
```

Unique constraint:

```text
UNIQUE (workspace_id, user_id)
```

A user can belong to multiple workspaces, but can only have one membership record per workspace.

## 10.3 Why separate Workspace and WorkspaceMember?

A workspace can have many users, and a user can belong to many workspaces.

This is a many-to-many relationship.

The membership table also stores relationship-specific data such as the user's role and join date.

## 10.4 Slug generation

We created:

```ts
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "workspace";
}
```

The purpose of `slugify` is to convert a human-readable name into a URL-friendly identifier.

For example:

```text
Product Team → product-team
Engineering Department → engineering-department
```

`normalize("NFKC")` applies Unicode compatibility normalization.

The regular expression supports Unicode letters and numbers rather than restricting slugs to ASCII characters.

## 10.5 Why search for an available slug?

Two users may create workspaces with the same name.

For example:

```text
product-team
product-team
```

Since the slug column is globally unique, the second workspace needs another slug.

We implemented bounded retries:

```ts
const MAX_SLUG_ATTEMPTS = 100;
```

Candidates:

```text
product-team
product-team-2
product-team-3
...
```

Why a maximum?

A loop should have a defined stopping point. Otherwise, a failure or unusual database condition could cause an unbounded retry.

Why use a unique constraint too?

Two requests may attempt to create the same slug simultaneously. Application-level checks alone cannot guarantee uniqueness under concurrency.

The database constraint remains the final authority.

## 10.6 Workspace creation transaction

Workspace creation performs two operations:

1. Insert the workspace.
2. Insert its creator as an OWNER.

Both operations happen in a single transaction.

The owner ID comes from the authenticated session, not from the submitted form.

## 10.7 Workspace query

We created `getUserWorkspaces(userId)`.

The query joins:

- `workspace_member`
- `workspace`

It returns only workspaces for which the user has a membership record.

This is a good example of scoping a query through the membership relationship.

## 10.8 Workspace detail access

`getUserWorkspace` retrieves a workspace only if the requesting user belongs to it.

Its parameters are:

```ts
type GetUserWorkspaceParams = {
  workspaceId: string;
  userId: string;
};
```

It joins `workspace` and `workspace_member`, then filters by both workspace ID and user ID.

This prevents users from accessing workspaces merely because they know their UUID.

## 10.9 UUID validation

We used a UUID regular expression as a format guard.

This prevents malformed identifiers from reaching the database query.

However:

**UUID validation is not authorization.**

A valid UUID can still belong to another user's workspace.

The membership query is what enforces access.

---

# 11. Project Domain

## 11.1 Project schema

A project belongs to exactly one workspace.

Current fields:

```text
project
├── id
├── workspace_id
├── name
├── description
├── created_at
└── updated_at
```

`workspace_id` is a foreign key to `workspace.id`.

Deleting a workspace cascades to its projects.

## 11.2 Composite unique constraint

We added:

```ts
unique("project_id_workspace_id_unique").on(table.id, table.workspaceId);
```

The project ID is already unique because it is the primary key.

Why add another unique constraint?

We need the pair `(project_id, workspace_id)` to be a valid referenced key for a future composite foreign key.

This lets the database verify that a project and its workspace belong together.

It is an important relational integrity technique.

## 11.3 Project validation

Our validation schema:

```ts
export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),

  description: z.string().trim().max(500).optional(),
});
```

The name is required.

The description is optional.

Both are trimmed before validation.

## 11.4 Project creation permissions

Our current policy:

- Workspace OWNER can create projects.
- Workspace ADMIN can create projects.
- Workspace MEMBER cannot create projects.

The Server Action checks the actual workspace membership before inserting.

## 11.5 Project listing

`getWorkspaceProjects` retrieves projects associated with a workspace only if the current user is a member of that workspace.

An important distinction:

Workspace membership allows a user to see the workspace's project list.

It does not automatically mean that a regular Workspace MEMBER can open every project.

Opening a project requires the separate project access policy.

---

# 12. Multi-Tenant Authorization and Security

## 12.1 Tenant isolation

TaskFlow is a multi-tenant application.

A tenant is represented by a workspace.

The same user can belong to multiple workspaces.

Every workspace-related query and mutation must verify the user's membership in the relevant workspace.

## 12.2 Workspace roles

Current roles:

| Role   | Meaning                  |
| ------ | ------------------------ |
| OWNER  | Workspace owner          |
| ADMIN  | Workspace administrator  |
| MEMBER | Regular workspace member |

## 12.3 Project roles

Current roles:

| Role    | Meaning                |
| ------- | ---------------------- |
| MANAGER | Project manager        |
| MEMBER  | Regular project member |

## 12.4 Project access policy

We established this policy:

- Workspace OWNER: automatic access to every project in the workspace.
- Workspace ADMIN: automatic access to every project in the workspace.
- Workspace MEMBER with Project MANAGER membership: access allowed.
- Workspace MEMBER with Project MEMBER membership: access allowed.
- Workspace MEMBER without project membership: access denied.
- Non-workspace member: access denied.

Automatic access does not mean OWNER or ADMIN must have a `project_member` record.

## 12.5 ProjectMember schema

The membership table:

```text
project_member
├── id
├── project_id
├── workspace_id
├── user_id
├── role
└── joined_at
```

The table has two important composite foreign keys.

### Project/workspace integrity

```text
(project_id, workspace_id)
    REFERENCES project(id, workspace_id)
```

This ensures the membership's workspace matches the actual workspace of the project.

### Workspace/user integrity

```text
(workspace_id, user_id)
    REFERENCES workspace_member(workspace_id, user_id)
```

This ensures that a project member must already be a member of the same workspace.

The database enforces this rule even if application code has a bug.

## 12.6 Project access query

`getUserProject` uses:

- An INNER JOIN to `workspace_member`.
- A LEFT JOIN to `project_member`.
- A WHERE condition checking workspace role or project membership.

The LEFT JOIN is important because Workspace OWNER and ADMIN may not have explicit project membership records.

The query returns both:

```ts
workspaceRole;
projectRole;
```

This is useful for later role-aware operations.

## 12.7 Why not rely on protected layouts?

A protected layout only protects the route rendering process.

It does not automatically protect Server Actions or API routes.

Every sensitive operation must independently check authentication and authorization.

## 12.8 Avoid insecure direct object references

Knowing a project ID or workspace ID must never be sufficient to access the resource.

Always scope queries by the authenticated user and relevant membership relationship.

## 12.9 Membership removal and cascading relationships

Removing a workspace membership cascades to related project membership records because of the composite foreign key.

This is useful for maintaining database consistency.

However, removing a project membership has additional implications when tasks are introduced.

We must decide how to handle tasks assigned to a member before deleting their membership.

---

# 13. Server Actions and Business Logic

## 13.1 Server Actions

A Server Action is a server-side function that can be invoked through supported React and Next.js mechanisms.

We use Server Actions for mutations such as:

- Creating a workspace
- Creating a project
- Adding a project member
- Removing a project member (planned)

A file containing Server Actions starts with:

```ts
"use server";
```

## 13.2 Separate responsibilities

A secure Server Action should follow this sequence:

1. Authenticate.
2. Validate input.
3. Retrieve the relevant resource.
4. Authorize the actor.
5. Verify business rules.
6. Perform the database mutation.
7. Return a safe result.

These steps solve different problems.

- Authentication identifies the actor.
- Validation checks the shape and format of input.
- Authorization determines whether the actor may perform the operation.
- Business rules enforce domain requirements.
- Database constraints preserve relational integrity.

## 13.3 Error handling

We return user-friendly error messages from actions.

Example:

```ts
try {
  // Database operation
} catch {
  return {
    success: false,
    message: "We couldn't complete the operation. Please try again.",
  };
}
```

Do not expose raw database errors, SQL statements, credentials, or internal implementation details to the browser.

In production, consider sanitized server-side logging and error monitoring.

## 13.4 Bounded retry loops

We used a bounded loop for slug generation.

The principle is useful beyond slug generation:

- Retry only operations that are safe to retry.
- Define a maximum number of attempts.
- Handle exhaustion explicitly.
- Let database constraints protect correctness.

## 13.5 `onConflictDoNothing`

We use this pattern to handle uniqueness conflicts without turning an expected duplicate into an unhandled exception.

Example:

```ts
const [inserted] = await tx
  .insert(workspace)
  .values({
    name,
    slug: candidateSlug,
  })
  .onConflictDoNothing({
    target: workspace.slug,
  })
  .returning();
```

If the slug already exists, no record is returned.

The same principle is used when adding project membership, where `(project_id, user_id)` must be unique.

## 13.6 Transactions versus single inserts

Not every database operation needs a transaction.

Workspace creation requires a transaction because it inserts a workspace and its owner membership.

A single project insert does not need a transaction unless additional dependent operations are introduced.

Use transactions when several operations must succeed or fail together.

---

# 14. Testing Strategy

## 14.1 Testing layers

TaskFlow uses multiple testing levels.

### Unit tests

Test isolated functions and business logic.

Examples:

- Zod schemas
- Slug utilities
- Server Action authorization branches
- Query behavior using mocked dependencies

### Component tests

Use React Testing Library to test components from the user's perspective.

Examples:

- Password input visibility
- Login form validation
- Registration form behavior

### End-to-end tests

Use Playwright to test actual browser workflows.

Examples:

- Registration
- Login
- Navigation
- Protected routes

### Integration tests

Use real PostgreSQL to verify actual queries, relationships, and constraints.

These tests are especially important for multi-tenant authorization.

## 14.2 Vitest and React Testing Library

We use:

- Vitest
- React Testing Library
- `@testing-library/user-event`
- `@testing-library/jest-dom`
- jsdom

A component test should focus on observable behavior rather than implementation details.

For example, test whether a user can toggle password visibility instead of testing internal state variables.

## 14.3 Mocking

Mocks allow unit tests to isolate the function being tested.

For example, a Server Action can mock:

- `getSession`
- A project authorization query
- Database operations

This makes it possible to test each authorization branch without connecting to PostgreSQL.

But mocks do not prove that actual SQL joins or database constraints behave correctly.

## 14.4 PostgreSQL integration tests

We created a separate database:

```text
taskflow_test
```

It is isolated from the development database.

The test connection is stored in:

```text
.env.test.local
```

Example:

```dotenv
TASKFLOW_TEST_DATABASE_URL="postgresql://..."
```

This file must never be committed.

## 14.5 Protecting the test database

The integration setup checks the database name before configuring the database connection.

It expects:

```text
taskflow_test
```

If another database is configured, setup throws an error.

This is a safety guard against accidentally running destructive test fixtures against the development database.

## 14.6 Separate Vitest configuration

We created:

```text
vitest.integration.config.ts
```

It includes only:

```ts
include: ["src/**/*.integration.test.ts"];
```

The normal unit-test configuration excludes integration tests.

This separation allows us to run:

```powershell
npm run test
npm run test:integration
```

## 14.7 Why `fileParallelism: false`?

Our integration tests create and remove database fixtures.

Running multiple files against the same database simultaneously can cause fixture collisions or cleanup problems.

Disabling file parallelism makes the test execution more predictable.

## 14.8 Real PostgreSQL project access tests

We tested the project access query using actual PostgreSQL records.

The tests covered:

1. Workspace OWNER allowed.
2. Workspace ADMIN allowed.
3. Project MANAGER allowed.
4. Project MEMBER allowed.
5. Workspace MEMBER without project membership denied.
6. Non-workspace member denied.
7. Nonexistent project returns null.

All seven tests passed.

This was an important milestone because we verified the real joins and authorization conditions, not just mocked function results.

## 14.9 Test fixture cleanup

Integration tests create temporary users, workspaces, memberships, and projects.

Cleanup should happen even when a test fails.

Use lifecycle hooks such as:

```ts
beforeAll(...)
afterAll(...)
```

Use random identifiers where appropriate to prevent fixture collisions.

---

# 15. Git Workflow

## 15.1 Commit naming

We use conventional prefixes:

```text
feat: add project table
test: add project access integration tests
fix: correct workspace query
refactor: simplify project access logic
```

## 15.2 Milestone checkpoint

Before committing:

```powershell
git status
```

Review the changed files.

Stage only the intended files:

```powershell
git add ...
```

Commit:

```powershell
git commit -m "feat: descriptive message"
```

Push:

```powershell
git push origin main
```

Verify:

```powershell
git status
```

## 15.3 Never commit secrets or generated test output

Do not commit:

- `.env`
- `.env.local`
- `.env.test.local`
- Credentials
- Database dumps containing private data
- Playwright test reports
- Temporary test artifacts
- Local coverage output

---

# 16. Important Troubleshooting Lessons

## 16.1 Deprecated APIs

We encountered a deprecation warning involving:

```ts
validationResult.error.flatten().fieldErrors;
```

The lesson: do not ignore deprecation warnings simply because the code still works.

We replaced this approach with explicit issue filtering and mapping:

```ts
fieldErrors: {
  name: validationResult.error.issues
    .filter((issue) => issue.path[0] === "name")
    .map((issue) => issue.message),
}
```

This also makes the field-error mapping explicit.

## 16.2 TypeScript implicit `any`

We encountered an implicit `any` error for the previous state parameter of `useActionState`.

The lesson: annotate callback parameters when TypeScript cannot infer them correctly.

Example:

```ts
async (
  previousState: CreateWorkspaceResult,
  formData: FormData,
): Promise<CreateWorkspaceResult> => {
  return createWorkspaceAction(formData);
};
```

## 16.3 Next.js asynchronous params

We used asynchronous route parameter types:

```ts
params: Promise<{
  workspaceId: string;
}>;
```

Then:

```ts
const { workspaceId } = await params;
```

Always follow the API conventions of the Next.js version used by the project.

## 16.4 Vitest accidentally discovering Playwright tests

We separated unit and E2E test discovery through Vitest configuration.

The lesson: testing frameworks should have explicit file inclusion and exclusion patterns when they share a repository.

## 16.5 Test database isolation

We created a dedicated PostgreSQL database for integration tests instead of using the development database.

This prevents test fixtures and cleanup operations from damaging development data.

## 16.6 Singular versus plural query functions

We have two distinct functions:

- `getUserWorkspaces(userId)` retrieves multiple workspaces.
- `getUserWorkspace({ workspaceId, userId })` retrieves one accessible workspace.

The names are similar, but their responsibilities are different.

Use the plural function on the dashboard and the singular function on the workspace detail route.

## 16.7 Drizzle `$onUpdate` is not a database trigger

An ORM-side timestamp callback does not automatically run for raw SQL updates.

This distinction matters when mixing ORM and direct SQL operations.

---

# 17. Architecture Decisions and Future Considerations

These decisions guide future implementation.

## 17.1 Workspace membership is the authorization source of truth

The current database membership records determine workspace roles.

We do not rely on stale role claims stored in the session.

## 17.2 Project membership is separate from workspace membership

A user may belong to a workspace but not to every project.

Workspace OWNER and ADMIN have automatic project access.

Regular workspace members require explicit project membership.

## 17.3 ProjectMember composite foreign keys

The database ensures:

- Project and workspace belong together.
- Project member is also a member of the same workspace.

## 17.4 Task assignment

Planned rule:

A task's assignee must be a member of the same project.

Tasks can be unassigned.

The future Task table should use a relational constraint that references project membership.

We must consider the behavior of task assignments when a project member is removed.

## 17.5 Workspace owner protection

A future workspace membership-management feature must prevent removing or demoting the last OWNER without transferring ownership.

This is an application-level invariant requiring careful transactional handling.

## 17.6 Task and activity transactions

When task mutations and activity logging are introduced, both should happen in the same transaction.

This prevents task changes from succeeding without their corresponding activity records.

## 17.7 ActivityLog polymorphic references

An activity log may reference different entity types.

A generic entity ID cannot always be protected by a normal foreign key.

We will need to decide how to preserve integrity and queryability for this design.

## 17.8 Membership removal

When workspace membership is removed, project memberships cascade through the existing composite foreign key.

When project membership is removed, future task assignments must be handled first.

A possible policy is to unassign the user's tasks and log the changes in one transaction.

This will be revisited when the Task model exists.

---

# 18. Milestone Progress

This section records completed and in-progress implementation work.

## Earlier foundations

- Initial Next.js application and routing.
- Shared UI components.
- Authentication forms.
- Unit testing setup.
- Playwright E2E setup.
- PostgreSQL and Docker setup.
- Drizzle ORM setup.
- Better Auth integration.
- Login and registration connected to Better Auth.
- Server-side session helper.
- Authenticated application layout and user menu.

## Milestone 23 — Workspace Foundation

### 23.5 — Workspace schema and migration

- Workspace table created.
- WorkspaceMember table created.
- Workspace roles defined.
- Unique workspace membership constraint.
- User and workspace foreign keys.
- Migration generated, applied, and verified.

### 23.6 — Workspace validation and slug utility

- Zod workspace schema.
- Slug utility.
- Unit tests.
- Tests and build verified.

### 23.7 — Workspace creation Server Action

- Authentication check.
- Server-side validation.
- Slug generation.
- Bounded retry loop.
- Database transaction.
- Initial OWNER membership.

### 23.8 — Workspace creation tests

- Authentication failure.
- Validation failure.
- Successful creation.
- Slug collision handling.
- Retry exhaustion.
- Transaction-related failure handling.

### 23.9 — Workspace creation UI

- `useActionState`.
- Pending state.
- Field errors.
- Success state.
- Router refresh.

### 23.10 — Dashboard workspace integration

- User workspace query.
- Empty state.
- Workspace cards.
- Workspace role display.
- Creation form integration.

### 23.11 — Workspace navigation and detail page

- Clickable workspace cards.
- Workspace detail route.
- Membership-based access control.
- Workspace navigation.
- Shared application navigation.

## Milestone 23.12 — Project Foundation

### 23.12.1 — Project database model

- Project table.
- Workspace foreign key.
- Composite unique key.
- Workspace index.

### 23.12.2 — Project migration

- Migration applied.
- PostgreSQL schema verified.

### 23.12.3 — Project validation

- Project name validation.
- Description validation.
- Unit tests.

### 23.12.4 — Project creation Server Action

- Authentication.
- Workspace access verification.
- OWNER/ADMIN permission check.
- Project creation.

### 23.12.5 — Project creation tests

- Authentication and authorization tests.
- Input validation tests.
- OWNER/ADMIN success cases.
- Database failure handling.

### 23.12.6 — Project listing and creation UI

- Workspace project query.
- Project cards.
- Empty state.
- Create Project form.
- Role-aware UI.

## Milestone 23.13 — Project Membership and Protected Access

### 23.13.1 — ProjectMember database model

- Project role enum.
- ProjectMember table.
- Composite foreign keys.
- Unique project membership constraint.
- Supporting indexes.
- Migration applied and verified.

### 23.13.2 — Project access query

- Workspace OWNER/ADMIN automatic access.
- Project MANAGER access.
- Project MEMBER access.
- Regular workspace member without project membership denied.
- Non-workspace member denied.

### 23.13.3 — Protected project detail page

- Authenticated project route.
- Project access check.
- Workspace/project URL consistency check.
- Role-aware project detail display.

### 23.13.4 — Project access unit tests

- Mocked query behavior.
- Invalid UUID handling.
- Empty results.
- Database error propagation.

### 23.13.5 — PostgreSQL integration testing

- Dedicated `taskflow_test` database.
- Integration-test configuration.
- Database-name safety check.
- Real PostgreSQL project access tests.

**Result:** Seven project access integration tests passed.

## Milestone 23.14 — Project Membership Management

### 23.14.1 — Permission rules

Agreed policy:

| Actor           | Add MEMBER | Add MANAGER | Remove MEMBER | Remove MANAGER |
| --------------- | ---------- | ----------- | ------------- | -------------- |
| Workspace OWNER | Yes        | Yes         | Yes           | Yes            |
| Workspace ADMIN | Yes        | Yes         | Yes           | Yes            |
| Project MANAGER | Yes        | No          | Yes           | No             |
| Project MEMBER  | No         | No          | No            | No             |

### 23.14.2 — Project member queries

Implemented:

- `getProjectMembers`
- `getAvailableProjectMembers`

The first returns explicit project memberships to users with project access.

The second returns eligible workspace members to users allowed to manage project membership.

### 23.14.3 — Add Project Member action

Implementation prepared:

- Session authentication.
- Project access verification.
- Role-based authorization.
- Target workspace membership verification.
- Protection against unauthorized MANAGER assignment.
- Duplicate membership handling.
- Safe action result.

### 23.14.4 — Add Project Member unit tests

Test suite prepared to cover:

- Unauthenticated requests.
- Invalid project ID.
- Invalid input.
- Missing project access.
- Insufficient permissions.
- Role escalation prevention.
- Target workspace membership.
- Duplicate membership.
- Successful OWNER, ADMIN, and MANAGER operations.
- Database errors.

**Verification status:** Confirm test execution and Git checkpoint before marking this milestone complete.

---

# 19. Reusable Learning Template

For every future milestone, add a section using this structure.

## Milestone XX — [Milestone Name]

### 1. Objective

What are we building, and why?

### 2. Core Concepts

Explain the important React, Next.js, TypeScript, database, or architecture concepts.

### 3. Implementation

Describe the files and important code patterns introduced.

### 4. Why We Chose This Approach

Explain the design decisions and alternatives.

### 5. Security and Best Practices

Record important validation, authorization, performance, and maintainability considerations.

### 6. Testing

Record test cases, commands, and verification results.

### 7. Troubleshooting

Record errors, their causes, and solutions.

### 8. Key Takeaways

Summarize the most important things to remember.

### 9. Completion Status

Record:

- Implementation status
- Test status
- Build status
- Commit hash, if available
- Push status

---

# Final Learning Principle

The objective of TaskFlow is not simply to produce a working application.

The objective is to understand how a modern full-stack application is designed, implemented, secured, tested, and maintained.

Every important implementation decision should answer three questions:

1. **What are we doing?**
2. **Why are we doing it this way?**
3. **What should I remember and apply in future projects?**

This document should grow alongside the application and become a reusable technical reference for future projects.

## Milestone 23.14.5 — Remove Project Member

### Purpose

Implemented a Server Action that allows authorized users to remove an explicit project membership without deleting the user's account or workspace membership.

### Server Action

File: `src/features/projects/actions/remove-project-member.ts`

The action performs these steps:

1. Authenticates the actor using the server-side session.
2. Validates the project UUID and target user ID.
3. Retrieves the project together with the actor's workspace and project roles.
4. Checks whether the actor has permission to remove project members.
5. Retrieves the target user's project membership.
6. Prevents Project Managers from removing other Project Managers.
7. Deletes the membership and returns the deleted record.

### Authorization Rules

- Workspace OWNER and ADMIN can remove either MANAGER or MEMBER.
- Project MANAGER can remove MEMBER only.
- Project MEMBER cannot remove anyone.

### Important Implementation Concepts

**Conditional DELETE**

For Project Managers, the DELETE query includes a role condition:

`role = MEMBER`

This is important because authorization decisions should not rely exclusively on an earlier database read. The target's role could change between the SELECT and DELETE operations.

Including the role condition in the DELETE statement provides an additional database-level safeguard.

**RETURNING**

The action uses Drizzle's `.returning()` to retrieve the deleted membership. If no row is returned, the action reports that the membership could not be removed.

**Project membership versus workspace membership**

Removing a project membership does not delete the user's account or workspace membership. The user may still belong to the workspace and access other projects.

### Unit Tests

Tests cover:

- Unauthenticated requests.
- Invalid project IDs and target user IDs.
- Actors without project access.
- Insufficient permissions.
- Attempts by Project Managers to remove other Managers.
- Successful removal by Project Managers and Workspace Owners.
- Missing target memberships.
- Deletion failures and generic error responses.

### Important Future Consideration

When the Task model is implemented, removing a project member may also require unassigning that user's tasks and recording an activity log. Those operations should be handled together in a database transaction.

### Milestone Status

- [x] Remove Project Member Server Action
- [x] Role-based authorization
- [x] Conditional deletion
- [x] Unit tests
- [x] Verification
- [x] Commit and push
