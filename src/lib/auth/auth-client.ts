import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
/**
 * The server already contains our actual configuration:
    - Database adapter
    - Authentication settings
    - Secret
    - Session behavior
    - Provider configuration
The client doesn't need any of that. It only needs to know how to communicate with the authentication server.

This is a valuable architectural principle:
Keep browser-side dependencies and configuration as small as possible. Never move server responsibilities 
into the browser simply because it is convenient.
 */
