import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getEffectiveUserId } from "./users";

// Get current KYC status for the user
export const getKycStatus = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getEffectiveUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("kycVerifications")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .first();
    },
});

// Start or resume KYC process
export const startKyc = mutation({
    args: {
        orgId: v.optional(v.union(v.string(), v.null())) // Implicitly passed from frontend
    },
    handler: async (ctx, args) => {
        const userId = await getEffectiveUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        // Note: We might want one KYC per Org or per User.
        // If Org is selected, we should prioritize querying by orgId if we had an index,
        // but currently it checks `byUserId`. 
        // For now, let's keep the existing check but ensure we save the correct orgId.

        const existing = await ctx.db
            .query("kycVerifications")
            .withIndex("byUserId", (q) => q.eq("userId", userId))
            .first();

        if (existing) return existing._id;

        // Use arg first, then fallback to user record (though user record might be stale)
        let orgId = args.orgId;

        if (!orgId) {
            const user = await ctx.db
                .query("users")
                .withIndex("byExternalId", (q) => q.eq("externalId", userId))
                .unique();
            orgId = user?.orgId;
        }

        return await ctx.db.insert("kycVerifications", {
            userId: userId,
            orgId: orgId,
            status: "draft",
            step: 1,
            documents: [],
        });
    },
});

// Update Step 1: Business Details
export const updateKycDetails = mutation({
    args: {
        id: v.id("kycVerifications"),
        companyName: v.string(),
        registrationNumber: v.string(),
        vatNumber: v.string(),
        country: v.string(),
    },
    handler: async (ctx, args) => {
        // In prod: verify user owns this record
        await ctx.db.patch(args.id, {
            companyName: args.companyName,
            registrationNumber: args.registrationNumber,
            vatNumber: args.vatNumber,
            country: args.country,
            step: 2 // Move to next step
        });
    },
});

// Update Step 2: Add Document
export const addKycDocument = mutation({
    args: {
        id: v.id("kycVerifications"),
        type: v.string(),
        fileUrl: v.string(),
        fileId: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const kyc = await ctx.db.get(args.id);
        if (!kyc) throw new Error("Record not found");

        const newDocs = [...kyc.documents, {
            type: args.type,
            fileUrl: args.fileUrl,
            fileId: args.fileId,
            uploadedAt: Date.now()
        }];

        await ctx.db.patch(args.id, {
            documents: newDocs
        });
    }
});

// Submit for Review
export const submitKyc = mutation({
    args: { id: v.id("kycVerifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "submitted",
            submittedAt: Date.now(),
            step: 3
        });

        // AUDIT LOG
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await ctx.db.insert("auditLogs", {
                action: "kyc.submitted",
                entityType: "kyc",
                entityId: args.id,
                userId: identity.subject,
                timestamp: Date.now(),
                details: { step: 3 }
            });
        }
    }
});

// Start of New Admin Mutations

// Approve KYC
export const approveKyc = mutation({
    args: { id: v.id("kycVerifications") },
    handler: async (ctx, args) => {
        // In prod: Check for Admin Role here
        const kyc = await ctx.db.get(args.id);
        if (!kyc) throw new Error("KYC record not found");

        await ctx.db.patch(args.id, {
            status: "verified",
            verifiedAt: Date.now()
        });

        // Audit Log
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await ctx.db.insert("auditLogs", {
                action: "kyc.approved",
                entityType: "kyc",
                entityId: args.id,
                userId: identity.subject,
                timestamp: Date.now(),
                details: { adminId: identity.subject }
            });
        }
    }
});

// Reject KYC
export const rejectKyc = mutation({
    args: {
        id: v.id("kycVerifications"),
        reason: v.string()
    },
    handler: async (ctx, args) => {
        // In prod: Check for Admin Role here
        await ctx.db.patch(args.id, {
            status: "rejected",
            notes: args.reason,
        });

        // Audit Log
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            await ctx.db.insert("auditLogs", {
                action: "kyc.rejected",
                entityType: "kyc",
                entityId: args.id,
                userId: identity.subject,
                timestamp: Date.now(),
                details: { reason: args.reason }
            });
        }
    }
});

// List Pending for Admin
export const listPendingKyc = query({
    args: {},
    handler: async (ctx) => {
        // In prod: Check for Admin Role
        return await ctx.db
            .query("kycVerifications")
            .withIndex("byStatus", (q) => q.eq("status", "submitted"))
            .collect();
    }
});

// Regional Risk Data for GeoRisk Navigator
export const getRegionalRiskData = query({
    args: { regions: v.array(v.string()) },
    handler: async (ctx, args) => {
        // Mock data logic
        return args.regions.map(region => {
            // Randomly assign risk for demo purposes, or deterministic based on string length
            const risks = ["Low", "Medium", "High"];
            const riskIndex = region.length % 3;
            return {
                region,
                riskLevel: risks[riskIndex],
                score: (riskIndex + 1) * 25,
                details: "Automated regional stability analysis based on historical data."
            };
        });
    }
});
