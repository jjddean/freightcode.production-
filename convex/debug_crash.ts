
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { HMRCService } from "../src/services/hmrc/HMRCService";

export const testCrash = action({
    args: {},
    handler: async (ctx) => {
        console.log("Starting Debug Crash Test...");

        // Test HMRCService instantiation
        try {
            console.log("Instantiating HMRCService...");
            const svc = HMRCService.create("id", "secret", "uri", "sandbox");
            console.log("Service created:", !!svc);
        } catch (e: any) {
            console.error("HMRCService Failed:", e);
            return { success: false, error: "HMRCService Failed: " + e.message };
        }

        // 1. Check if internal.integrations exists
        if (!internal.integrations) {
            console.error("CRITICAL: internal.integrations is undefined!");
            return { success: false, error: "internal.integrations missing" };
        }
        console.log("internal.integrations exists:", !!internal.integrations);

        // 2. Try running the query query
        try {
            console.log("Running getIntegration query...");
            const integration = await ctx.runQuery(internal.integrations.getIntegration, { provider: "hmrc" });
            console.log("Integration found:", integration);
        } catch (e: any) {
            console.error("Query Failed:", e.message);
            return { success: false, error: "Query Failed: " + e.message };
        }

        return { success: true, message: "No crash in basic checks" };
    },
});
