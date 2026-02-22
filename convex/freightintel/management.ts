import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Manually trigger USA AMS ingestion (for testing)
 */
export const triggerUSAIngest = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        return await ctx.runAction(
            internal.freightintel.ingest_usa_ams.scheduledIngest
        );
    },
});

/**
 * Manually trigger score recalculation for all forwarders
 */
export const triggerScoreRecalc = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        return await ctx.runMutation(
            internal.freightintel.internal.recalculateAllScores
        );
    },
});

/**
 * Manually trigger database cleanup
 */
export const triggerCleanup = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        return await ctx.runMutation(
            internal.freightintel.maintenance.cleanupOldData
        );
    },
});

/**
 * Manually trigger full profile rebuild
 * WARNING: Deletes and re-creates all profiles
 */
export const triggerProfileRebuild = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        return await ctx.runMutation(
            internal.freightintel.maintenance.rebuildForwarderProfiles
        );
    },
});

/**
 * Simulate contact discovery for a forwarder profile
 */
export const runContactDiscovery = action({
    args: {
        profileId: v.id("forwarder_profiles"),
    },
    handler: async (ctx, args): Promise<{
        success: boolean;
        message?: string;
        email?: string;
        phone?: string;
        website?: string;
        linkedin?: string;
        discoveryStatus?: string;
        confidenceScore?: number;
    }> => {
        // Simulate a delay for the "processing"
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const profile = await ctx.runQuery(internal.freightintel.internal.getProfileById, {
            profileId: args.profileId,
        });

        if (!profile) return { success: false, message: "Profile not found" };

        // Mock discovery data
        const domain = profile.name.toLowerCase().replace(/\s+/g, "") + ".com";
        const discoveryData = {
            email: `info@${domain}`,
            phone: `+1 ${Math.floor(Math.random() * 900 + 100)}-555-${Math.floor(Math.random() * 9000 + 1000)}`,
            website: `https://www.${domain}`,
            linkedin: `https://linkedin.com/company/${profile.name.toLowerCase().replace(/\s+/g, "-")}`,
            discoveryStatus: "verified",
            confidenceScore: Math.floor(Math.random() * 20 + 80), // High confidence for verified
        };

        // Update profile
        await ctx.runMutation(internal.freightintel.internal.updateDiscoveryDetails, {
            profileId: args.profileId,
            ...discoveryData,
        });

        return { success: true, ...discoveryData };
    },
});
