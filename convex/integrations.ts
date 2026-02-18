import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save or update an API integration (e.g. HMRC OAuth tokens)
 */
export const saveIntegration = internalMutation({
    args: {
        provider: v.string(),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
        orgId: v.optional(v.union(v.string(), v.null())),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("integrations")
            .withIndex("byProvider", (q) => q.eq("provider", args.provider))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                accessToken: args.accessToken,
                refreshToken: args.refreshToken,
                expiresAt: args.expiresAt,
                status: args.status,
            });
            return existing._id;
        }

        return await ctx.db.insert("integrations", {
            provider: args.provider,
            accessToken: args.accessToken,
            refreshToken: args.refreshToken,
            expiresAt: args.expiresAt,
            orgId: args.orgId,
            status: args.status,
        });
    },
});

/**
 * Get an integration for a specific provider
 */
export const getIntegration = internalQuery({
    args: {
        provider: v.string(),
        orgId: v.optional(v.union(v.string(), v.null())),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("integrations")
            .withIndex("byProvider", (q) => q.eq("provider", args.provider))
            .filter((q) => q.eq(q.field("orgId"), args.orgId))
            .first();
    },
});
