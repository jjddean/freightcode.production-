import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createNotificationHelper } from "./notifications";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { getCityCoords, calculateDistance } from "./pricing";

const ML_GATEWAY_URL = "http://127.0.0.1:8000";

export const upsertShipment = mutation({
  args: {
    shipmentId: v.string(),
    tracking: v.object({
      status: v.string(),
      currentLocation: v.object({
        city: v.string(),
        state: v.string(),
        country: v.string(),
        coordinates: v.object({ lat: v.number(), lng: v.number() }),
      }),
      estimatedDelivery: v.string(),
      carrier: v.string(),
      trackingNumber: v.string(),
      service: v.string(),
      shipmentDetails: v.object({
        weight: v.string(),
        dimensions: v.string(),
        origin: v.string(),
        destination: v.string(),
        value: v.string(),
      }),
      events: v.array(
        v.object({
          timestamp: v.string(),
          status: v.string(),
          location: v.string(),
          description: v.string(),
        })
      ),
      // Add missing fields to match schema and frontend usage
      riskLevel: v.optional(v.string()),
      customs: v.optional(v.object({
        brokerName: v.optional(v.string()),
        brokerEmail: v.optional(v.string()),
        filingStatus: v.optional(v.string()),
        entryNumber: v.optional(v.string()),
        clearedAt: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, { shipmentId, tracking }) => {
    // resolve current user (if any) to link shipment to userId
    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: string | null = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();
      if (user) currentUserId = user._id;
    }

    const existing = await ctx.db
      .query("shipments")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", shipmentId))
      .unique();

    let shipmentDocId = existing?._id;

    if (existing) {
      const oldStatus = existing.status;
      await ctx.db.patch(existing._id, {
        status: tracking.status,
        currentLocation: tracking.currentLocation,
        estimatedDelivery: tracking.estimatedDelivery,
        carrier: tracking.carrier,
        trackingNumber: tracking.trackingNumber,
        service: tracking.service,
        shipmentDetails: tracking.shipmentDetails,
        riskLevel: tracking.riskLevel, // Support DFF
        customs: tracking.customs,     // Support DFF
        lastUpdated: Date.now(),
        ...(existing.userId ? {} : currentUserId ? { userId: currentUserId as any } : {}),
      });

      // Trigger automated workflow if status changed
      if (oldStatus !== tracking.status) {
        await ctx.scheduler.runAfter(0, internal.workflows.onShipmentStatusChange, {
          shipmentId,
          oldStatus,
          newStatus: tracking.status,
        });
      }

      // Notify User of Status Change
      if (oldStatus !== tracking.status && existing.userId) {
        const userDoc = await ctx.db.get(existing.userId);
        if (userDoc) {
          await createNotificationHelper(ctx, userDoc.externalId, {
            title: 'Shipment Update',
            message: `Shipment ${shipmentId} is now ${tracking.status}.`,
            type: 'shipment',
            priority: 'medium',
            actionUrl: '/shipments'
          });
        }
      }
    } else {
      // ENFORCEMENT: Check Usage Limits for New Shipments
      // 1. Determine Tier (Org or User)
      let tier = "free";
      if ((identity as any).org_id) {
        const org = await ctx.db
          .query("organizations")
          .withIndex("byClerkOrgId", (q) => q.eq("clerkOrgId", (identity as any).org_id))
          .unique();
        tier = org?.subscriptionTier || "free";
      } else if (currentUserId) {
        const user = await ctx.db.get(currentUserId as any);
        tier = (user as any)?.subscriptionTier || "free";
      }

      // 2. Count Shipments in Current Month IF Free
      if (tier === "free") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let count = 0;
        if ((identity as any).org_id) {
          const shipments = await ctx.db
            .query("shipments")
            .withIndex("byOrgId", (q) => q.eq("orgId", (identity as any).org_id))
            .collect(); // In prod, use a dedicated monthly counter or faster index
          count = shipments.filter(s => s.createdAt >= startOfMonth).length;
        } else if (currentUserId) {
          const shipments = await ctx.db
            .query("shipments")
            .withIndex("byUserId", (q) => q.eq("userId", currentUserId as any))
            .collect();
          count = shipments.filter(s => s.createdAt >= startOfMonth).length;
        }

        if (count >= 5) {
          throw new Error("PLAN_LIMIT_REACHED: You have reached your monthly limit of 5 shipments. Please upgrade to Pro for unlimited shipments.");
        }
      }

      shipmentDocId = await ctx.db.insert("shipments", {
        shipmentId,
        status: tracking.status,
        currentLocation: tracking.currentLocation,
        estimatedDelivery: tracking.estimatedDelivery,
        carrier: tracking.carrier,
        trackingNumber: tracking.trackingNumber,
        service: tracking.service,
        shipmentDetails: tracking.shipmentDetails,
        riskLevel: tracking.riskLevel, // Support DFF
        customs: tracking.customs,     // Support DFF
        lastUpdated: Date.now(),
        createdAt: Date.now(),
        userId: currentUserId as any,
        orgId: (identity as any).org_id,
      } as any);

      // Notify User of Creation
      if (identity && identity.subject) {
        await createNotificationHelper(ctx, identity.subject, {
          title: 'Shipment Created',
          message: `New shipment ${shipmentId} created successfully.`,
          type: 'shipment',
          priority: 'medium',
          actionUrl: '/shipments'
        });
      }
    }

    // Replace events by appending new ones
    if (shipmentDocId) {
      // no bulk delete in Convex; events table is additive; we just insert new ones
      for (const e of tracking.events) {
        await ctx.db.insert("trackingEvents", {
          shipmentId: shipmentDocId,
          timestamp: e.timestamp,
          status: e.status,
          location: e.location,
          description: e.description,
          createdAt: Date.now(),
        });
      }
    }

    // ML Brain: Trigger Predictive ETA calculation
    await ctx.scheduler.runAfter(0, api.shipments.updatePredictiveETA, {
      shipmentIdString: shipmentId,
      carrier: tracking.carrier,
      service: tracking.service,
      origin: tracking.shipmentDetails.origin,
      destination: tracking.shipmentDetails.destination,
    });

    return shipmentDocId!;
  },
});

export const getShipment = query({
  args: { shipmentId: v.string() },
  handler: async (ctx, { shipmentId }) => {
    const shipment = await ctx.db
      .query("shipments")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", shipmentId))
      .unique();
    if (!shipment) return null;
    const events = await ctx.db
      .query("trackingEvents")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", shipment._id))
      .collect();
    return { shipment, events };
  },
});

// New: list shipments for dashboard
// New: list shipments for dashboard with strict Org filtering
export const listShipments = query({
  args: {
    search: v.optional(v.string()),
    onlyMine: v.optional(v.boolean()),
    orgId: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, { search, onlyMine, orgId: argsOrgId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = argsOrgId;

    let list = [] as any[];
    if (onlyMine) {
      // "Only Mine" context - usually strict to the user regardless of Org?? 
      // User requested "Only Mine" implies current user's items. 
      // But typically this is scoped to the context (Org or Personal).
      // For now, retaining user-centric filter but arguably should be intersected with Org if present.
      // Keeping original behavior for `onlyMine` as it might be used specially.
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();
      if (!user) return [];
      list = await ctx.db
        .query("shipments")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .order("desc")
        .collect();
    } else if (orgId) {
      // Filter by organization
      list = await ctx.db
        .query("shipments")
        .withIndex("byOrgId", (q) => q.eq("orgId", orgId))
        .order("desc")
        .collect();
    } else {
      // Personal account - filter by userId AND ensure orgId is missing/null
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();
      if (!user) return [];
      list = await ctx.db
        .query("shipments")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .filter((q) => q.or(q.eq(q.field("orgId"), null), q.eq(q.field("orgId"), undefined)))
        .order("desc")
        .collect();
    }

    if (!search || search.trim() === "") return list;
    const s = search.toLowerCase();
    return list.filter((sh) => {
      const fields = [
        sh.shipmentId,
        sh.status,
        sh.carrier,
        sh.service,
        sh.trackingNumber,
        sh.shipmentDetails.origin,
        sh.shipmentDetails.destination,
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());
      return fields.some((f) => f.includes(s));
    });
  },
});

export const clearAllShipments = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Get all shipments
    const allShipments = await ctx.db.query("shipments").collect();

    // 2. Delete each shipment
    for (const shipment of allShipments) {
      await ctx.db.delete(shipment._id);
    }

    // 3. Clear events as well
    const allEvents = await ctx.db.query("trackingEvents").collect();
    for (const event of allEvents) {
      await ctx.db.delete(event._id);
    }

    return { success: true, count: allShipments.length };
  },
});

// Admin: Flag a shipment as High Risk
export const flagShipment = mutation({
  args: {
    shipmentId: v.id("shipments"), // This expects the internal ID usually, let's accept string ID or internal ID. 
    // Wait, UI usually has the internal ID `_id`. Let's assume we pass the internal ID for efficiency.
    // If the UI passes the string `shipmentId` field, we'd need to lookup.
    // Standardizing on passing the internal `_id` is better for mutations.
    // But typical existing code uses `shipmentId` (string) for lookups. 
    // Let's support looking up by `shipmentId` string to match `upsertShipment`.
    shipmentIdString: v.string(),
    riskLevel: v.string(), // "medium", "high"
    reason: v.string()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const shipment = await ctx.db
      .query("shipments")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", args.shipmentIdString))
      .unique();

    if (!shipment) throw new Error("Shipment not found");

    await ctx.db.patch(shipment._id, {
      riskLevel: args.riskLevel,
      flagReason: args.reason,
      flaggedBy: identity.subject,
      lastUpdated: Date.now()
    });

    // Audit Log
    await ctx.db.insert("auditLogs", {
      action: "shipment.flagged",
      entityType: "shipment",
      entityId: args.shipmentIdString,
      userId: identity.subject,
      details: { risk: args.riskLevel, reason: args.reason },
      timestamp: Date.now()
    });
  }
});

/**
 * ML ACTION: Calculates a high-precision ETA using the ML Gateway.
 */
export const updatePredictiveETA = action({
  args: {
    shipmentIdString: v.string(),
    carrier: v.string(),
    service: v.string(),
    origin: v.string(),
    destination: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // 1. Calculate Distance
      const originCoords = getCityCoords(args.origin);
      const destCoords = getCityCoords(args.destination);
      let distance = 5000;
      if (originCoords && destCoords) {
        distance = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      }

      // 2. Map Service Type to ML Expectation
      let mlService = "standard_ocean";
      const s = args.service.toLowerCase();
      if (s.includes("air")) mlService = "express_air";
      if (s.includes("truck")) mlService = "trucking";

      // 3. Call ML Gateway
      const response = await fetch(`${ML_GATEWAY_URL}/predict-eta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: args.carrier,
          service_type: mlService,
          distance: distance,
          congestion_index: 0.5, // Future: fetch from GeoRisk
          weather_risk: 0.2,     // Future: fetch from GeoRisk
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const days = result.predicted_days;

        // Calculate timestamp
        const arrivalDate = new Date();
        arrivalDate.setDate(arrivalDate.getDate() + Math.ceil(days));

        await ctx.runMutation(api.shipments.savePredictedETA, {
          shipmentIdString: args.shipmentIdString,
          predictedDate: arrivalDate.toISOString(),
        });
      }
    } catch (error) {
      console.error("ML ETA Error:", error);
    }
  },
});

export const savePredictedETA = mutation({
  args: {
    shipmentIdString: v.string(),
    predictedDate: v.string(),
  },
  handler: async (ctx, args) => {
    const shipment = await ctx.db
      .query("shipments")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", args.shipmentIdString))
      .unique();

    if (shipment) {
      await ctx.db.patch(shipment._id, {
        predictedDelivery: args.predictedDate,
      });
    }
  },
});

// Admin: Clear Risk Flag
export const clearShipmentFlag = mutation({
  args: { shipmentIdString: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const shipment = await ctx.db
      .query("shipments")
      .withIndex("byShipmentId", (q) => q.eq("shipmentId", args.shipmentIdString))
      .unique();

    if (!shipment) throw new Error("Shipment not found");

    await ctx.db.patch(shipment._id, {
      riskLevel: "low", // Reset to low/safe
      flagReason: undefined,
      flaggedBy: undefined,
      lastUpdated: Date.now()
    });

    // Audit Log
    await ctx.db.insert("auditLogs", {
      action: "shipment.unflagged",
      entityType: "shipment",
      entityId: args.shipmentIdString,
      userId: identity.subject,
      timestamp: Date.now()
    });
  }
});