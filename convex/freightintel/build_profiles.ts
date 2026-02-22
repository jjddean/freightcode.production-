import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Builds pre-aggregated profiles for Shippers (Exporters).
 * This optimizes search performance by moving from 10k+ shipments to ~500 profiles.
 */
export const buildShipperProfiles = mutation({
    args: {},
    handler: async (ctx) => {
        // Collect all shipments for analysis
        const shipments = await ctx.db.query("trade_shipments").collect();

        const shipperMap = new Map<string, any>();

        shipments.forEach(s => {
            if (!s.shipper) return;

            const key = `${s.shipper}-${s.originCountry}`;
            if (!shipperMap.has(key)) {
                shipperMap.set(key, {
                    name: s.shipper,
                    originCountry: s.originCountry,
                    totalShipments: 0,
                    shipmentsToUK: 0,
                    commodities: new Set<string>(),
                    forwarders: new Set<string>(),
                    lastShipmentDate: 0,
                });
            }

            const profile = shipperMap.get(key);
            profile.totalShipments++;

            // Normalize UK detection
            const isUK = s.destinationCountry === "United Kingdom" || s.destinationCountry === "UK" || s.destinationCountry === "GB";
            if (isUK) {
                profile.shipmentsToUK++;
            }

            if (s.commodity) profile.commodities.add(s.commodity);
            if (s.forwarder) profile.forwarders.add(s.forwarder);
            profile.lastShipmentDate = Math.max(profile.lastShipmentDate, s.shipmentDate);
        });

        // Clean existing or update (for now we clear and rebuild to avoid stale data)
        const existing = await ctx.db.query("shipper_profiles").collect();
        for (const p of existing) await ctx.db.delete(p._id);

        // Save new profiles
        for (const [_, profile] of shipperMap) {
            await ctx.db.insert("shipper_profiles", {
                name: profile.name,
                originCountry: profile.originCountry,
                totalShipments: profile.totalShipments,
                shipmentsToUK: profile.shipmentsToUK,
                topCommodities: Array.from(profile.commodities as Set<string>).slice(0, 5),
                topForwarders: Array.from(profile.forwarders as Set<string>).slice(0, 5),
                lastShipmentDate: profile.lastShipmentDate,
                updatedAt: Date.now(),
            });
        }

        return { success: true, count: shipperMap.size };
    },
});

/**
 * Builds pre-aggregated profiles for Consignees (UK Importers).
 */
export const buildConsigneeProfiles = mutation({
    args: {},
    handler: async (ctx) => {
        const shipments = await ctx.db.query("trade_shipments").collect();

        const consigneeMap = new Map<string, any>();

        shipments.forEach(s => {
            // Filter only UK-bound or implied UK importers
            const isUK = s.destinationCountry === "United Kingdom" || s.destinationCountry === "UK" || s.destinationCountry === "GB";
            if (!isUK || !s.consignee) return;

            const key = s.consignee;
            if (!consigneeMap.has(key)) {
                consigneeMap.set(key, {
                    name: s.consignee,
                    ukLocation: "United Kingdom", // Default or extract if possible from consignee string
                    totalShipments: 0,
                    origins: new Set<string>(),
                    commodities: new Set<string>(),
                    forwarders: new Set<string>(),
                    lastShipmentDate: 0,
                });
            }

            const profile = consigneeMap.get(key);
            profile.totalShipments++;
            if (s.originCountry) profile.origins.add(s.originCountry);
            if (s.commodity) profile.commodities.add(s.commodity);
            if (s.forwarder) profile.forwarders.add(s.forwarder);
            profile.lastShipmentDate = Math.max(profile.lastShipmentDate, s.shipmentDate);
        });

        const existing = await ctx.db.query("consignee_profiles").collect();
        for (const p of existing) await ctx.db.delete(p._id);

        for (const [_, profile] of consigneeMap) {
            await ctx.db.insert("consignee_profiles", {
                name: profile.name,
                ukLocation: profile.ukLocation,
                totalShipments: profile.totalShipments,
                topOrigins: Array.from(profile.origins as Set<string>).slice(0, 5),
                topCommodities: Array.from(profile.commodities as Set<string>).slice(0, 5),
                topForwarders: Array.from(profile.forwarders as Set<string>).slice(0, 5),
                lastShipmentDate: profile.lastShipmentDate,
                updatedAt: Date.now(),
            });
        }

        return { success: true, count: consigneeMap.size };
    },
});
