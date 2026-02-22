

import { createClerkClient } from "@clerk/backend";

export const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY || "sk_test_placeholder",
});
