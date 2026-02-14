import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createNotificationHelper } from "./notifications";

/**
 * Lists shipments that require customs attention (pending or review).
 */
export const getPendingCustoms = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        // Check if admin (optional but recommended for this specific query)
        // const user = await ctx.db.query("users").withIndex("byExternalId", (q) => q.eq("externalId", identity.subject)).unique();
        // if (user?.role !== "admin" && user?.role !== "platform:superadmin") return [];

        return await ctx.db
            .query("shipments")
            .filter((q) =>
                q.or(
                    q.eq(q.field("customs.filingStatus"), "pending"),
                    q.eq(q.field("customs.filingStatus"), "review")
                )
            )
            .collect();
    },
});

/**
 * Submits a customs filing record, updates shipment status, and logs the action.
 */
export const submitCustomsFiling = mutation({
    args: {
        shipmentId: v.id("shipments"),
        reference: v.string(),
        filedAt: v.number(),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const shipment = await ctx.db.get(args.shipmentId);
        if (!shipment) throw new Error("Shipment not found");

        // Update the shipment status
        await ctx.db.patch(args.shipmentId, {
            customs: {
                ...shipment.customs,
                filingStatus: "filed",
                entryNumber: args.reference,
                filedAt: args.filedAt,
                notes: args.notes,
            },
            lastUpdated: Date.now(),
        } as any);

        // 1. Log the update in Audit Logs
        await ctx.db.insert("auditLogs", {
            action: "customs.filed",
            entityType: "shipment",
            entityId: shipment.shipmentId,
            userId: identity.subject,
            userEmail: identity.email,
            details: {
                reference: args.reference,
                filedAt: args.filedAt,
                notes: args.notes
            },
            timestamp: Date.now(),
        });

        // 2. Notify the shipment owner
        if (shipment.userId) {
            const user = await ctx.db.get(shipment.userId);
            if (user) {
                await createNotificationHelper(ctx, user.externalId, {
                    title: "Customs Filed",
                    message: `Customs has been successfully filed for shipment ${shipment.shipmentId}. Ref: ${args.reference}`,
                    type: "shipment",
                    priority: "medium",
                    actionUrl: "/shipments"
                });
            }
        }

        return { success: true };
    },
});

/**
 * Rejects or flags a filing for review.
 */
export const updateCustomsStatus = mutation({
    args: {
        shipmentId: v.id("shipments"),
        status: v.union(
            v.literal("review"),
            v.literal("rejected"),
            v.literal("cleared"),
            v.literal("held")
        ),
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const shipment = await ctx.db.get(args.shipmentId);
        if (!shipment) throw new Error("Shipment not found");

        await ctx.db.patch(args.shipmentId, {
            customs: {
                ...shipment.customs,
                filingStatus: args.status,
                notes: args.notes,
            },
            lastUpdated: Date.now(),
        } as any);

        // Log the change
        await ctx.db.insert("auditLogs", {
            action: `customs.${args.status}`,
            entityType: "shipment",
            entityId: shipment.shipmentId,
            userId: identity.subject,
            details: { status: args.status, notes: args.notes },
            timestamp: Date.now(),
        });

        return { success: true };
    },
});
