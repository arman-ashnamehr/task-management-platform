// This file is for HTTP entry point

import { auth } from "@/lib/auth/auth";
//The toNextJsHandler helper adapts Better Auth's request handler to Next.js Route Handler conventions.

import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
/**By exporting these two functions, we tell Next.js:
- When a GET request reaches this route, use Better Auth's GET handler.
- When a POST request reaches this route, use Better Auth's POST handler. */
