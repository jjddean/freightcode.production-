import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

/**
 * Calculate Partner Need Score for a forwarder
 * Score: 0-100 (higher = more likely to need UK partner)
 */

export const updateForwarderProfile = internalMutation({
    args: {
        forwarderName: v.string(),
        originCountry: v.string(),
        destinationCountry: v.string(),
    },
    handler: async (ctx, args) => {
        // Find or create forwarder profile
        // BEST PRACTICE: Use index instead of filter for profile lookups
        const forwarder = await ctx.db
            .query("forwarder_profiles")
            .withIndex("by_country", (q) => q.eq("originCountry", args.originCountry))
            .filter((q) => q.eq(q.field("name"), args.forwarderName))
            .first();

        // Get all shipments by this forwarder
        // BEST PRACTICE: Use by_forwarder index to avoid full table scan
        const allShipments = await ctx.db
            .query("trade_shipments")
            .withIndex("by_forwarder", (q) => q.eq("forwarder", args.forwarderName))
            .collect();

        const ukShipments = allShipments.filter(
            (s) => s.destinationCountry === "United Kingdom" || s.destinationCountry === "UK"
        );

        // Calculate stats
        const totalShipments = allShipments.length;
        const shipmentsToUK = ukShipments.length;

        // Safety check for empty shipments (unlikely if triggered by ingestion)
        if (totalShipments === 0) return;

        const lastShipmentDate = Math.max(
            ...allShipments.map((s) => s.shipmentDate),
            0
        );

        // Normalize name for global identity resolution
        const canonicalName = args.forwarderName
            .toLowerCase()
            .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|llc|plc|co|company)\b/g, "")
            .replace(/[^\w\s]/g, "")
            .trim();

        // Detect unique UK agents (consignees in UK)
        const uniqueUKAgents = new Set(
            ukShipments.map((s) => s.consignee)
        ).size;

        // Check if forwarder has UK office (simple heuristic)
        const hasUKOffice = await detectUKOffice(args.forwarderName);

        // Calculate Partner Need Score
        const score = calculatePartnerNeedScore({
            shipmentsToUK,
            totalShipments,
            uniqueUKAgents,
            hasUKOffice,
            lastShipmentDate,
        });

        if (forwarder) {
            await ctx.db.patch(forwarder._id, {
                totalShipments,
                shipmentsToUK,
                lastShipmentDate,
                uniqueUKAgents,
                hasUKOffice,
                partnerNeedScore: score,
                canonicalName,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("forwarder_profiles", {
                name: args.forwarderName,
                canonicalName,
                originCountry: args.originCountry,
                totalShipments,
                shipmentsToUK,
                lastShipmentDate,
                uniqueUKAgents,
                hasUKOffice,
                partnerNeedScore: score,
                discoveryStatus: "pending",
                confidenceScore: 0,
                updatedAt: Date.now(),
            });
        }
    },
});

/**
 * Calculate Partner Need Score (0-100)
 */
function calculatePartnerNeedScore(data: {
    shipmentsToUK: number;
    totalShipments: number;
    uniqueUKAgents: number;
    hasUKOffice: boolean;
    lastShipmentDate: number;
}): number {
    let score = 0;

    // Factor 1: UK Shipment Frequency (30 points max)
    if (data.shipmentsToUK >= 50) score += 30;
    else if (data.shipmentsToUK >= 20) score += 25;
    else if (data.shipmentsToUK >= 10) score += 20;
    else if (data.shipmentsToUK >= 5) score += 15;
    else if (data.shipmentsToUK >= 1) score += 10;

    // Factor 2: No UK Office (25 points)
    if (!data.hasUKOffice) score += 25;

    // Factor 3: Multiple UK Agents (20 points max)
    if (data.uniqueUKAgents >= 5) score += 20;
    else if (data.uniqueUKAgents >= 3) score += 15;
    else if (data.uniqueUKAgents === 2) score += 10;
    else if (data.uniqueUKAgents === 1) score += 5;

    // Factor 4: Recent Activity (15 points max)
    const daysSinceLastShipment = (Date.now() - data.lastShipmentDate) / (1000 * 60 * 60 * 24);
    if (daysSinceLastShipment <= 30) score += 15;
    else if (daysSinceLastShipment <= 60) score += 10;
    else if (daysSinceLastShipment <= 90) score += 5;

    // Factor 5: High Volume (10 points max)
    if (data.totalShipments >= 100) score += 10;
    else if (data.totalShipments >= 50) score += 7;
    else if (data.totalShipments >= 25) score += 5;

    return Math.min(Math.round(score), 100);
}

/**
 * Detect if forwarder has UK office
 * BEST PRACTICE: Expanded indicators for better heuristic accuracy
 */
async function detectUKOffice(forwarderName: string): Promise<boolean> {
    const ukIndicators = [
        "uk ltd", "uk limited", "london", "manchester", "birmingham",
        "glasgow", "liverpool", "bristol", "british", "gb logistics",
        "united kingdom", "southampton", "felixstowe", "heathrow"
    ];

    const nameLower = forwarderName.toLowerCase();
    return ukIndicators.some((indicator) => nameLower.includes(indicator));
}

/**
 * Batch recalculate all forwarder scores
 */
export const recalculateAllScores = internalMutation({
    args: {},
    handler: async (ctx) => {
        const forwarders = await ctx.db.query("forwarder_profiles").collect();
        let updated = 0;

        for (const forwarder of forwarders) {
            // BEST PRACTICE: Use scheduler for batch work to avoid timeout
            await ctx.scheduler.runAfter(
                0,
                internal.freightintel.internal.updateForwarderProfile,
                {
                    forwarderName: forwarder.name,
                    originCountry: forwarder.originCountry,
                    destinationCountry: "United Kingdom",
                }
            );
            updated++;
        }

        return { updated };
    },
});

/**
 * Get profile by ID (internal)
 */
export const getProfileById = internalQuery({
    args: { profileId: v.id("forwarder_profiles") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.profileId);
    },
});

/**
 * Update discovery details (internal)
 */
export const updateDiscoveryDetails = internalMutation({
    args: {
        profileId: v.id("forwarder_profiles"),
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
        linkedin: v.optional(v.string()),
        discoveryStatus: v.string(),
        confidenceScore: v.number(),
    },
    handler: async (ctx, args) => {
        const { profileId, ...details } = args;
        await ctx.db.patch(profileId, {
            ...details,
            updatedAt: Date.now(),
        });
    },
});
