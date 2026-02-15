import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const saveProcessedDocument = mutation({
    args: {
        fileName: v.string(),
        documentType: v.string(),
        rawText: v.string(),
        extractedFields: v.any(),
        tables: v.any(),
        confidence: v.number(),
        auditResult: v.any(),
        correctedText: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
            .unique();

        const docId = await ctx.db.insert("processed_documents", {
            ...args,
            userId: user?._id,
            createdAt: Date.now(),
            status: "processed",
        });

        return docId;
    },
});
