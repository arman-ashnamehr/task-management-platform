import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";

export async function getSession() {
  return auth.api.getSession({
    //In modern Next.js, headers() is asynchronous. We need to await it before passing the resulting headers to Better Auth.
    headers: await headers(),
  });
}
