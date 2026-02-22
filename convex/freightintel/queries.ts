import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Find forwarders shipping to UK from specific country
 */
export const findForwarders = query({
    args: {
        originCountry: v.optional(v.string()),
        minShipments: v.optional(v.number()),
        sortBy: v.optional(v.string()), // "shipments" | "score" | "recent"
    },
    handler: async (ctx, args) => {
        let forwarders = await ctx.db.query("forwarder_profiles").collect();

        // Filter by origin country
        if (args.originCountry) {
            forwarders = forwarders.filter(
                (f) => f.originCountry === args.originCountry
            );
        }

        // Filter by minimum shipments to UK
        const minShip = args.minShipments || 1;
        forwarders = forwarders.filter((f) => f.shipmentsToUK >= minShip);

        // Sort
        switch (args.sortBy) {
            case "score":
                forwarders.sort((a, b) => b.partnerNeedScore - a.partnerNeedScore);
                break;
            case "recent":
                forwarders.sort((a, b) => b.lastShipmentDate - a.lastShipmentDate);
                break;
            case "shipments":
            default:
                forwarders.sort((a, b) => b.shipmentsToUK - a.shipmentsToUK);
                break;
        }

        return forwarders;
    },
});

/**
 * Get lane statistics (origin → UK)
 */
export const getLaneStats = query({
    args: {
        originCountry: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let shipments = await ctx.db
            .query("trade_shipments")
            .withIndex("by_destination", (q) => q.eq("destinationCountry", "United Kingdom"))
            .collect();

        if (args.originCountry) {
            shipments = shipments.filter(
                (s) => s.originCountry === args.originCountry
            );
        }

        // Group by origin country
        const laneStats = new Map<string, {
            country: string;
            shipmentCount: number;
            uniqueForwarders: number;
            topPorts: Map<string, number>;
            topCommodities: Map<string, number>;
        }>();

        shipments.forEach((shipment) => {
            const country = shipment.originCountry;

            if (!laneStats.has(country)) {
                laneStats.set(country, {
                    country,
                    shipmentCount: 0,
                    uniqueForwarders: 0,
                    topPorts: new Map(),
                    topCommodities: new Map(),
                });
            }

            const stats = laneStats.get(country)!;
            stats.shipmentCount++;

            // Count ports
            if (shipment.originPort) {
                const portCount = stats.topPorts.get(shipment.originPort) || 0;
                stats.topPorts.set(shipment.originPort, portCount + 1);
            }

            // Count commodities
            if (shipment.commodity) {
                const commCount = stats.topCommodities.get(shipment.commodity) || 0;
                stats.topCommodities.set(shipment.commodity, commCount + 1);
            }
        });

        // Convert to array and format
        return Array.from(laneStats.values()).map((stats) => ({
            country: stats.country,
            shipmentCount: stats.shipmentCount,
            topPorts: Array.from(stats.topPorts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([port, count]) => ({ port, count })),
            topCommodities: Array.from(stats.topCommodities.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([commodity, count]) => ({ commodity, count })),
        }));
    },
});

/**
 * Get forwarder details with recent shipments
 */
export const getForwarderDetails = query({
    args: {
        forwarderId: v.id("forwarder_profiles"),
    },
    handler: async (ctx, args) => {
        const forwarder = await ctx.db.get(args.forwarderId);
        if (!forwarder) return null;

        // Get ALL shipments for analysis
        const allShipments = await ctx.db
            .query("trade_shipments")
            .withIndex("by_forwarder", (q) => q.eq("forwarder", forwarder.name))
            .collect();

        // Top Exporters
        const exporterCounts = new Map<string, number>();
        // Top UK Importers
        const importerCounts = new Map<string, number>();
        // Top HS Codes
        const hsCounts = new Map<string, number>();

        allShipments.forEach(s => {
            if (s.shipper) exporterCounts.set(s.shipper, (exporterCounts.get(s.shipper) || 0) + 1);
            if (s.destinationCountry === "United Kingdom" || s.destinationCountry === "UK") {
                if (s.consignee) importerCounts.set(s.consignee, (importerCounts.get(s.consignee) || 0) + 1);
            }
            if (s.hsCode) hsCounts.set(s.hsCode, (hsCounts.get(s.hsCode) || 0) + 1);
        });

        const topExporters = Array.from(exporterCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topImporters = Array.from(importerCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topHS = Array.from(hsCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([code, count]) => ({ code, count }));

        return {
            ...forwarder,
            recentShipments: allShipments.slice(0, 20),
            topExporters,
            topImporters,
            topHS,
            globalVolume: allShipments.length,
        };
    },
});

/**
 * Get multi-lane presence for a forwarder
 */
export const getMultiLanePresence = query({
    args: {
        canonicalName: v.string(),
        excludeProfileId: v.id("forwarder_profiles"),
    },
    handler: async (ctx, args) => {
        const others = await ctx.db
            .query("forwarder_profiles")
            .withIndex("by_canonical_name", (q) => q.eq("canonicalName", args.canonicalName))
            .filter((q) => q.neq(q.field("_id"), args.excludeProfileId))
            .collect();

        return others.map((f) => ({
            id: f._id,
            originCountry: f.originCountry,
            shipmentsToUK: f.shipmentsToUK,
            partnerNeedScore: f.partnerNeedScore,
        }));
    },
});

/**
 * Get user's watchlist
 */
export const getWatchlist = query({
    args: {
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const watchlistItems = await ctx.db
            .query("watchlist")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        const profiles = [];
        for (const item of watchlistItems) {
            const profile = await ctx.db.get(item.profileId);
            if (profile) profiles.push(profile);
        }

        return profiles;
    },
});

/**
 * Get intelligence alerts
 */
export const getAlerts = query({
    args: {
        userId: v.string(),
        onlyUnread: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let alertsQuery = ctx.db
            .query("intelligence_alerts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId));

        if (args.onlyUnread) {
            alertsQuery = alertsQuery.filter((q) => q.eq(q.field("isRead"), false));
        }

        return await alertsQuery.order("desc").collect();
    },
});

/**
 * Search forwarders by name
 */
export const searchForwarders = query({
    args: {
        searchTerm: v.string(),
    },
    handler: async (ctx, args) => {
        const allForwarders = await ctx.db.query("forwarder_profiles").collect();

        const searchLower = args.searchTerm.toLowerCase();

        return allForwarders
            .filter((f) => f.name.toLowerCase().includes(searchLower))
            .slice(0, 20);
    },
});

/**
 * Get opportunity dashboard stats
 */
export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const forwarders = await ctx.db.query("forwarder_profiles").collect();
        const shipments = await ctx.db.query("trade_shipments").collect();

        // High opportunity forwarders (high partner need score)
        const highOpportunity = forwarders
            .filter((f) => f.partnerNeedScore >= 70)
            .length;

        // Active lanes (countries with shipments)
        const activeLanes = new Set(shipments.map((s) => s.originCountry)).size;

        // Recent shipments (last 30 days)
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const recentShipments = shipments.filter(
            (s) => s.shipmentDate >= thirtyDaysAgo
        ).length;

        return {
            totalForwarders: forwarders.length,
            highOpportunityForwarders: highOpportunity,
            activeLanes,
            totalShipments: shipments.length,
            recentShipments,
        };
    },
});

/**
 * findShippers: Search for origin-side exporters based on country and volume.
 */
export const findShippers = query({
    args: {
        originCountry: v.optional(v.string()),
        minShipments: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let shippers;

        if (args.originCountry && args.originCountry !== "All Countries") {
            const country = args.originCountry;
            shippers = await ctx.db.query("shipper_profiles")
                .withIndex("by_country", (q) => q.eq("originCountry", country))
                .collect();
        } else {
            shippers = await ctx.db.query("shipper_profiles").collect();
        }

        const minShip = args.minShipments ?? 1;

        return shippers
            .filter(s => s.shipmentsToUK >= minShip)
            .sort((a, b) => b.shipmentsToUK - a.shipmentsToUK);
    },
});

/**
 * findConsignees: Search for UK importers based on volume and specialty.
 */
export const findConsignees = query({
    args: {
        minShipments: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const consignees = await ctx.db
            .query("consignee_profiles")
            .withIndex("by_shipments")
            .order("desc")
            .collect();

        const minShip = args.minShipments || 1;
        return consignees.filter(c => c.totalShipments >= minShip);
    },
});

/**
 * getShipperStats: Dashboard metrics for shippers.
 */
export const getShipperStats = query({
    args: {},
    handler: async (ctx) => {
        const shippers = await ctx.db.query("shipper_profiles").collect();
        return {
            totalShippers: shippers.length,
            heavyExporters: shippers.filter(s => s.shipmentsToUK > 50).length,
        };
    },
});
