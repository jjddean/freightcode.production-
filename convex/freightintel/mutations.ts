import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const saveShipment = internalMutation({
    args: {
        billOfLading: v.string(),
        shipper: v.string(),
        consignee: v.string(),
        forwarder: v.optional(v.string()),
        notifyParty: v.optional(v.string()),
        originCountry: v.string(),
        originPort: v.optional(v.string()),
        destinationCountry: v.string(),
        destinationPort: v.optional(v.string()),
        hsCode: v.optional(v.string()),
        commodity: v.optional(v.string()),
        containerType: v.optional(v.string()),
        weight: v.optional(v.number()),
        shipmentDate: v.number(),
        dataSource: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if already exists
        const existing = await ctx.db
            .query("trade_shipments")
            .withIndex("by_date", (q) => q.eq("shipmentDate", args.shipmentDate))
            .filter((q) => q.eq(q.field("billOfLading"), args.billOfLading))
            .first();

        if (existing) {
            return existing._id; // Skip duplicates
        }

        // Insert new shipment
        const shipmentId = await ctx.db.insert("trade_shipments", {
            ...args,
            createdAt: Date.now(),
        });

        // Update forwarder profile if forwarder exists
        if (args.forwarder) {
            // BEST PRACTICE: Use the new sophisticated internal scoring engine
            await ctx.scheduler.runAfter(0, internal.freightintel.internal.updateForwarderProfile, {
                forwarderName: args.forwarder,
                originCountry: args.originCountry,
                destinationCountry: args.destinationCountry,
            });
        }

        return shipmentId;
    },
});
/**
 * Toggle a forwarder on the user's watchlist
 */
export const toggleWatchlist = mutation({
    args: {
        userId: v.string(),
        profileId: v.id("forwarder_profiles"),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("watchlist")
            .withIndex("by_user_and_profile", (q) =>
                q.eq("userId", args.userId).eq("profileId", args.profileId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed" };
        } else {
            await ctx.db.insert("watchlist", {
                userId: args.userId,
                profileId: args.profileId,
                createdAt: Date.now(),
            });
            return { action: "added" };
        }
    },
});

/**
 * Mark an alert as read
 */
export const markAlertAsRead = mutation({
    args: {
        alertId: v.id("intelligence_alerts"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.alertId, {
            isRead: true,
        });
    },
});
/**
 * Bulk ingest shipments from manual CSV/JSON upload
 */
export const ingestManualBatch = mutation({
    args: {
        shipments: v.array(v.object({
            billOfLading: v.string(),
            shipper: v.string(),
            consignee: v.string(),
            forwarder: v.optional(v.string()),
            originCountry: v.string(),
            destinationCountry: v.string(),
            commodity: v.optional(v.string()),
            hsCode: v.optional(v.string()),
            weight: v.optional(v.number()),
            shipmentDate: v.number(),
        })),
        dataSource: v.string(),
    },
    handler: async (ctx, args) => {
        let imported = 0;
        let skipped = 0;

        for (const s of args.shipments) {
            // Check for duplicates
            const existing = await ctx.db
                .query("trade_shipments")
                .withIndex("by_date", (q) => q.eq("shipmentDate", s.shipmentDate))
                .filter((q) => q.eq(q.field("billOfLading"), s.billOfLading))
                .first();

            if (existing) {
                skipped++;
                continue;
            }

            await ctx.db.insert("trade_shipments", {
                ...s,
                dataSource: args.dataSource,
                createdAt: Date.now(),
            });

            // Update forwarder profile if exists
            if (s.forwarder) {
                await ctx.scheduler.runAfter(0, internal.freightintel.internal.updateForwarderProfile, {
                    forwarderName: s.forwarder,
                    originCountry: s.originCountry,
                    destinationCountry: s.destinationCountry,
                });
            }

            imported++;
        }

        return { imported, skipped };
    },
});
