import { internalMutation, mutation, query } from "./_generated/server"
import { internal, api } from "./_generated/api"
import { v } from "convex/values"
import { calculateShippingPrice, estimateTransitTime, generateMockLineItems } from "./pricing";
import { getFreightEstimates } from "./freightos";
import { findLocode } from "./locations";
import { getCityCoords, calculateDistance } from "./pricing";

const ML_GATEWAY_URL = "http://127.0.0.1:8000";

/**
 * Shared helper to normalize quotes from multiple sources and add ML Market Scores.
 */
async function normalizeAndScoreQuotes(newQuotes: any[], request: any): Promise<any[]> {
  return await Promise.all(newQuotes.map(async (r: any) => {
    const actualPrice = Number(r.price?.amount ?? r.cost ?? r.amount?.total ?? r.amount ?? 0);
    let marketScore = undefined;

    // ML Brain: Market Scoring
    try {
      const originCoords = getCityCoords(request.origin);
      const destCoords = getCityCoords(request.destination);
      let distance = 5000;
      if (originCoords && destCoords) {
        distance = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);
      }

      // Map service types to ML expectations
      let mlService = "standard_ocean";
      const lowerService = (r.serviceType || r.service_level || "").toLowerCase();
      if (lowerService.includes("air")) mlService = "express_air";
      if (lowerService.includes("truck")) mlService = "trucking";

      const prResponse = await fetch(`${ML_GATEWAY_URL}/predict-pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: mlService,
          weight: parseFloat(request.weight) || 1000,
          distance: distance
        }),
      });

      if (prResponse.ok) {
        const prResult = await prResponse.json();
        const predicted = prResult.predicted_price;
        marketScore = Math.min(100, Math.max(0, Math.round((predicted / actualPrice) * 50 + 40)));
      }
    } catch (err) {
      console.error("ML Pricing Error:", err);
    }

    return {
      carrierId: r.carrierId ?? r.id ?? `carrier-${r.carrier}`,
      carrierName: r.carrierName ?? r.carrier ?? "Unknown carrier",
      price: {
        amount: actualPrice,
        breakdown: {
          baseRate: Number(r.price?.breakdown?.baseRate ?? r.amount?.baseRate ?? 0),
          documentation: Number(r.price?.breakdown?.documentation ?? r.amount?.documentation ?? 0),
          fuelSurcharge: Number(r.price?.breakdown?.fuelSurcharge ?? r.amount?.fuelSurcharge ?? 0),
          securityFee: Number(r.price?.breakdown?.securityFee ?? r.amount?.securityFee ?? 0),
        },
        currency: r.price?.currency ?? r.currency ?? "USD",
        lineItems: (r.price?.lineItems && r.price.lineItems.length > 0)
          ? r.price.lineItems
          : generateMockLineItems(request.origin, request.destination),
      },
      serviceType: r.serviceType ?? r.service ?? r.service_level ?? "unknown",
      transitTime: r.transitTime ?? r.transit_time ?? "unknown",
      validUntil: r.validUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      marketScore: marketScore,
    };
  }));
}

// Internal helper for quote creation logic
async function performQuoteCreation(ctx: any, args: { request: any, orgId?: string | null }) {
  const { request, orgId: argsOrgId } = args;
  try {
    const identity = await ctx.auth.getUserIdentity();
    let linkedUserId: any = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q: any) => q.eq("externalId", identity.subject))
        .unique();
      if (user) linkedUserId = user._id as any;
    }

    const orgId = argsOrgId || (identity as any)?.org_id;

    let newQuotes: any[] = request.quotes || [];

    // If no quotes provided, generate mock/fallback ones
    if (newQuotes.length === 0) {
      // Fallback: Check contracts
      const originCode = findLocode(request.origin);
      const destCode = findLocode(request.destination);

      if (originCode && destCode) {
        const contracts = await ctx.db
          .query("contracts")
          .withIndex("byRoute", (q: any) => q.eq("origin", originCode).eq("destination", destCode))
          .collect();

        for (const contract of contracts) {
          newQuotes.push({
            carrierId: `contract-${contract._id}`,
            carrierName: contract.carrier,
            serviceType: "Contract Rate",
            transitTime: "25-30 days",
            price: {
              amount: contract.price,
              currency: contract.currency,
              breakdown: { baseRate: contract.price, fuelSurcharge: 0, securityFee: 0, documentation: 0 }
            },
            validUntil: contract.expirationDate
          });
        }
      }

      // Mock Fallback if still empty
      if (newQuotes.length === 0) {
        const pricing = calculateShippingPrice({
          origin: request.origin,
          destination: request.destination,
          weight: request.weight,
          serviceType: request.serviceType,
          cargoType: request.cargoType,
        });
        newQuotes.push({
          carrierId: `mock-${Date.now()}`,
          carrierName: "freightcode Logistics",
          serviceType: request.serviceType || "Standard Freight",
          transitTime: estimateTransitTime(request.origin, request.destination, request.serviceType),
          price: {
            amount: pricing,
            currency: "USD",
            lineItems: generateMockLineItems(request.origin, request.destination)
          },
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString()
        });
      }
    }

    const normalizedQuotes = await normalizeAndScoreQuotes(newQuotes, request);

    const quoteId = `QT-${Date.now()}`;
    const quoteDoc: any = {
      ...request,
      quoteId,
      status: "success",
      quotes: normalizedQuotes,
      createdAt: Date.now(),
    };

    if (orgId) quoteDoc.orgId = orgId;
    if (linkedUserId) quoteDoc.userId = linkedUserId;

    const docId = await ctx.db.insert("quotes", quoteDoc);

    return { quoteId, docId, quotes: normalizedQuotes };
  } catch (error) {
    console.error("FAILED to create quote:", error);
    throw new Error(`Quote creation failed: ${(error as any).message}`);
  }
}
export const createQuote = mutation({
  args: {
    request: v.object({
      origin: v.string(),
      destination: v.string(),
      serviceType: v.string(),
      cargoType: v.string(),
      weight: v.string(),
      dimensions: v.object({ length: v.string(), width: v.string(), height: v.string() }),
      value: v.string(),
      incoterms: v.string(),
      urgency: v.string(),
      additionalServices: v.array(v.string()),
      contactInfo: v.object({ name: v.string(), email: v.string(), phone: v.string(), company: v.string() }),
      quotes: v.optional(v.array(v.any())),
      selectedRate: v.optional(v.any()),
    }),
    orgId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    return await performQuoteCreation(ctx, args);
  },
});

export const createInstantQuoteAndBooking = mutation({
  args: {
    request: v.object({
      origin: v.string(),
      destination: v.string(),
      serviceType: v.string(),
      cargoType: v.string(),
      weight: v.string(),
      dimensions: v.object({ length: v.string(), width: v.string(), height: v.string() }),
      value: v.string(),
      incoterms: v.string(),
      urgency: v.string(),
      additionalServices: v.array(v.string()),
      contactInfo: v.object({ name: v.string(), email: v.string(), phone: v.string(), company: v.string() }),
      quotes: v.optional(v.array(v.any())),
    }),
    orgId: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    return await performQuoteCreation(ctx, args);
  },
});

export const listQuotes = query({
  args: { orgId: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const orgId = args.orgId;

    if (orgId) {
      // Filter by organization
      return await ctx.db
        .query("quotes")
        .withIndex("byOrgId", (q: any) => q.eq("orgId", orgId))
        .order("desc")
        .collect();
    } else {
      // Personal account - filter by userId AND ensure orgId is undefined
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();

      if (!user) return [];

      return await ctx.db
        .query("quotes")
        .withIndex("byUserId", (q: any) => q.eq("userId", user._id))
        .filter((q: any) => q.or(q.eq(q.field("orgId"), null), q.eq(q.field("orgId"), undefined)))
        .order("desc")
        .collect();
    }
  },
});

export const getQuoteByQuoteId = query({
  args: { quoteId: v.string() },
  handler: async (ctx, { quoteId }) => {
    return await ctx.db
      .query("quotes")
      .withIndex("byQuoteId", (q: any) => q.eq("quoteId", quoteId))
      .unique();
  },
});

export const getQuote = getQuoteByQuoteId;

// New: list quotes for the current authenticated user
export const listMyQuotes = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) return [];

    return await ctx.db
      .query("quotes")
      .withIndex("byUserId", (q: any) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Backfill mutation to add lineItems to existing quotes
export const backfillQuotesWithLineItems = mutation({
  args: {},
  handler: async (ctx) => {
    const allQuotes = await ctx.db.query("quotes").collect();
    let updated = 0;

    for (const quote of allQuotes) {
      const origin = quote.origin || "Origin";
      const destination = quote.destination || "Destination";

      // Check if quotes array needs updating
      const existingQuotes = quote.quotes || [];
      let needsUpdate = false;

      const updatedQuotes = existingQuotes.map((q: any) => {
        if (q.price && !q.price.lineItems) {
          needsUpdate = true;
          return {
            ...q,
            price: {
              ...q.price,
              lineItems: generateMockLineItems(origin, destination)
            }
          };
        }
        return q;
      });

      if (needsUpdate) {
        await ctx.db.patch(quote._id, { quotes: updatedQuotes });
        updated++;
      }
    }

    return { total: allQuotes.length, updated };
  },
});

export const createPublicQuote = mutation({
  args: {
    request: v.object({
      origin: v.string(),
      destination: v.string(),
      serviceType: v.string(),
      cargoType: v.string(),
      weight: v.string(),
      dimensions: v.object({ length: v.string(), width: v.string(), height: v.string() }),
      value: v.string(),
      incoterms: v.string(),
      urgency: v.string(),
      additionalServices: v.array(v.string()),
      contactInfo: v.object({ name: v.string(), email: v.string(), phone: v.string(), company: v.string() }),
    }),
  },
  handler: async (ctx, { request }) => {
    // 1. Generate Guest ID
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 2. Mock Pricing Logic (DFF MVP)
    const totalWeight = parseFloat(request.weight) || 1000;
    const basePrice = Math.round(totalWeight * (request.serviceType === "air" ? 5.5 : 1.2));

    const quotes = [{
      carrierId: `rate-guest-${Date.now()}`,
      carrierName: request.serviceType === "air" ? "Express Air (Spot)" : "Ocean Saver (Spot)",
      serviceType: request.serviceType === "air" ? "Air Freight" : "FCL Ocean",
      transitTime: request.serviceType === "air" ? "3-5 days" : "25-35 days",
      price: {
        amount: basePrice,
        currency: "USD",
        breakdown: { baseRate: basePrice, fuelSurcharge: 0, securityFee: 0, documentation: 0 },
        lineItems: generateMockLineItems(request.origin, request.destination)
      },
      validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    }];

    const normalizedQuotes = await normalizeAndScoreQuotes(quotes, request);

    // 3. Save Quote
    const quoteId = `QT-G-${Date.now()}`;
    await ctx.db.insert("quotes", {
      ...request,
      quoteId,
      status: "success",
      quotes: normalizedQuotes,
      guestId,
      userId: undefined,
      orgId: undefined,
      createdAt: Date.now(),
    });

    return { quoteId, guestId, quotes: normalizedQuotes };
  },
});
