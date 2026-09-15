import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Auth calls from the browser go through /api/auth, where rate limiting applies.
export const authClient = createAuthClient({
  plugins: [adminClient()],
});
