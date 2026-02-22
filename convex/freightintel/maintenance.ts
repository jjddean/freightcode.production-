import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Clean up old data to keep database lean
 * Removes shipments older than 2 years
 */
export const cleanupOldData = internalMutation({
    args: {},
    handler: async (ctx) => {
        const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
        const twoYearsAgo = Date.now() - TWO_YEARS_MS;

        // We use a query and collect, but for massive datasets, 
        // we'd want to use a paginated approach or a recurring action.
        const oldShipments = await ctx.db
            .query("trade_shipments")
            .withIndex("by_date", (q) => q.lt("shipmentDate", twoYearsAgo))
            .collect();

        let deleted = 0;

        for (const shipment of oldShipments) {
            await ctx.db.delete(shipment._id);
            deleted++;
        }

        console.log(`[Cleanup] Deleted ${deleted} shipments older than 2 years`);
        return { deleted };
    },
});

/**
 * Rebuild all forwarder profiles from scratch
 * Use if scoring logic changes significantly or data gets corrupted
 */
export const rebuildForwarderProfiles = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Delete all existing profiles
        const existingProfiles = await ctx.db.query("forwarder_profiles").collect();
        for (const profile of existingProfiles) {
            await ctx.db.delete(profile._id);
        }

        // 2. Get all unique forwarders from shipments
        // Note: In large DBs, this would be a heavy operation
        const allShipments = await ctx.db.query("trade_shipments").collect();

        const forwarderMap = new Map<string, {
            name: string;
            originCountry: string;
        }>();

        allShipments.forEach(shipment => {
            if (shipment.forwarder) {
                const key = `${shipment.forwarder}-${shipment.originCountry}`;
                if (!forwarderMap.has(key)) {
                    forwarderMap.set(key, {
                        name: shipment.forwarder,
                        originCountry: shipment.originCountry,
                    });
                }
            }
        });

        console.log(`[Rebuild] Found ${forwarderMap.size} unique forwarders to process`);

        // 3. Trigger profile updates for each (scheduled to avoid timeout)
        for (const [_, forwarder] of forwarderMap) {
            await ctx.scheduler.runAfter(
                0,
                internal.freightintel.internal.updateForwarderProfile,
                {
                    forwarderName: forwarder.name,
                    originCountry: forwarder.originCountry,
                    destinationCountry: "United Kingdom",
                }
            );
        }

        return { rebuilt: forwarderMap.size };
    },
});
