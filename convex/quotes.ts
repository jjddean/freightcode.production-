import { internalMutation, mutation, query } from "./_generated/server"
import { internal, api } from "./_generated/api"
import { v } from "convex/values"
import { calculateShippingPrice, estimateTransitTime, generateMockLineItems } from "./pricing";
import { getFreightEstimates } from "./freightos";
import { findLocode } from "./locations";


// ... (imports remain)
export const createQuote = mutation({
  args: {
    request: v.object({
      // ... (existing fields)
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
    response: v.optional(v.object({
      quoteId: v.string(),
      status: v.string(),
      quotes: v.array(v.any()),
    })),
    orgId: v.optional(v.union(v.string(), v.null())), // New: receive org context
  },
  handler: async (ctx, { request, response, orgId: argsOrgId }) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      let linkedUserId: any = null;
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
          .unique();
        if (user) linkedUserId = user._id as any;
      }

      // Determine orgId: Arg > Token > undefined
      const orgId = argsOrgId || (identity as any)?.org_id;

      // 1. Map Cities to UN/LOCODES (Using Database)
      const originCode = findLocode(request.origin);
      const destCode = findLocode(request.destination);

      if (!originCode || !destCode) {
        throw new Error(`Could not find UN/LOCODE for route: ${request.origin} -> ${request.destination}. Please use major ports (e.g. Shanghai, Los Angeles, Rotterdam).`);
      }

      // Initialize quotes array
      const newQuotes: any[] = [];

      // 1.5 CHECK CONTRACTS (DFF Feature)
      // Look for negotiated rates first
      const contractRates = await ctx.db
        .query("contracts")
        .withIndex("byRoute", (q) => q.eq("origin", originCode).eq("destination", destCode))
        .collect();


      if (contractRates.length > 0) {
        for (const contract of contractRates) {
          newQuotes.push({
            carrierId: `rate-contract-${contract._id}`,
            carrierName: contract.carrier,
            serviceType: "Contract Ocean", // DFF Label
            transitTime: "25-30 days", // Mock transit for now
            price: {
              amount: contract.price,
              currency: contract.currency,
              breakdown: {
                baseRate: contract.price,
                fuelSurcharge: 0,
                securityFee: 0,
                documentation: 0
              }
            },
            validUntil: contract.expirationDate
          });
        }
      }

      // 2. Call Freightos API (Spot Market)
      let estimates: any = null;
      /* 
      // TEMPORARILY DISABLED TO ENSURE MOCK RATES WORK FOR DEMO
      try {
        const totalWeight = parseFloat(request.weight) || 1000;
        estimates = await getFreightEstimates({
          origin: originCode,
          destination: destCode,
          load: [{
            quantity: 1,
            unitType: "boxes",
            unitWeightKg: totalWeight,
            unitVolumeCBM: totalWeight * 0.005
          }]
        });
      } catch (err) {
        console.warn("Freightos API failed, falling back to mock rates:", err);
      }
      */

      // First, check if SeaRates quotes were passed in (from the action wrapper)
      if (request.quotes && request.quotes.length > 0) {
        console.log(`[Quotes] Using ${request.quotes.length} pre-fetched SeaRates quotes`);
        newQuotes.push(...request.quotes);
      }

      // FALLBACK: If no API data, use Mock Data
      // This ensures we always have at least some quotes to show
      if (newQuotes.length === 0 && (!estimates || (!estimates.OCEAN && !estimates.AIR))) {
        // Mock Ocean
        newQuotes.push({
          carrierId: `rate-ocean-mock-${Date.now()}`,
          carrierName: "Ocean Line (Mock)",
          serviceType: "Standard Ocean",
          transitTime: Number(request.weight) > 5000 ? "40-45 days" : "30-35 days", // Dynamic
          price: {
            amount: 3500 + (Math.random() * 500), // Dynamic
            currency: "USD",
            breakdown: {
              baseRate: 2800,
              fuelSurcharge: 500,
              securityFee: 150,
              documentation: 50
            },
            lineItems: generateMockLineItems(request.origin, request.destination)
          },
          validUntil: new Date(Date.now() + 7 * 86400000).toISOString()
        });

        // Mock Air
        newQuotes.push({
          carrierId: `rate-air-mock-${Date.now()}`,
          carrierName: "Air Express (Mock)",
          serviceType: "Express Air",
          transitTime: "3-5 days",
          price: {
            amount: 8200 + (Math.random() * 1000), // Dynamic
            currency: "USD",
            breakdown: {
              baseRate: 6000,
              fuelSurcharge: 1800,
              securityFee: 300,
              documentation: 100
            },
            lineItems: generateMockLineItems(request.origin, request.destination)
          },
          validUntil: new Date(Date.now() + 3 * 86400000).toISOString()
        });
      } else {
        // 3. Map Real OCEAN Results
        if (estimates.OCEAN?.priceEstimates && estimates.OCEAN?.transitTime) {
          newQuotes.push({
            carrierId: `rate-ocean-${Date.now()}`,
            carrierName: "Freightos Ocean",
            serviceType: "Standard Ocean",
            transitTime: `${estimates.OCEAN.transitTime.min}-${estimates.OCEAN.transitTime.max} days`,
            price: {
              amount: Math.round(estimates.OCEAN.priceEstimates.min),
              currency: "USD",
              breakdown: {
                baseRate: Math.round(estimates.OCEAN.priceEstimates.min * 0.8),
                fuelSurcharge: Math.round(estimates.OCEAN.priceEstimates.min * 0.15),
                securityFee: Math.round(estimates.OCEAN.priceEstimates.min * 0.05),
                documentation: 50
              }
            },
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        // 4. Map Real AIR Results
        if (estimates.AIR?.priceEstimates && estimates.AIR?.transitTime) {
          newQuotes.push({
            carrierId: `rate-air-${Date.now()}`,
            carrierName: "Freightos Air",
            serviceType: "Express Air",
            transitTime: `${estimates.AIR.transitTime.min}-${estimates.AIR.transitTime.max} days`,
            price: {
              amount: Math.round(estimates.AIR.priceEstimates.min),
              currency: "USD",
              breakdown: {
                baseRate: Math.round(estimates.AIR.priceEstimates.min * 0.7),
                fuelSurcharge: Math.round(estimates.AIR.priceEstimates.min * 0.2),
                securityFee: Math.round(estimates.AIR.priceEstimates.min * 0.05),
                documentation: 25
              }
            },
            validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      }

      if (newQuotes.length === 0) {
        throw new Error("No valid quotes found for this route.");
      }

      const normalizedQuotes = newQuotes.map((r: any) => ({
        carrierId: r.carrierId ?? r.id ?? `carrier-${r.carrier}`,
        carrierName: r.carrierName ?? r.carrier ?? "Unknown carrier",
        price: {
          // Handle Shippo format (cost) and legacy format (price.amount)
          amount: Number(r.price?.amount ?? r.cost ?? r.amount?.total ?? r.amount ?? 0),
          breakdown: {
            baseRate: Number(r.price?.breakdown?.baseRate ?? r.amount?.baseRate ?? 0),
            documentation: Number(r.price?.breakdown?.documentation ?? r.amount?.documentation ?? 0),
            fuelSurcharge: Number(r.price?.breakdown?.fuelSurcharge ?? r.amount?.fuelSurcharge ?? 0),
            securityFee: Number(r.price?.breakdown?.securityFee ?? r.amount?.securityFee ?? 0),
          },
          currency: r.price?.currency ?? r.currency ?? "USD",
          // Always ensure lineItems exist - generate if not present or empty
          lineItems: (r.price?.lineItems && r.price.lineItems.length > 0)
            ? r.price.lineItems
            : generateMockLineItems(request.origin, request.destination),
        },
        serviceType: r.serviceType ?? r.service ?? r.service_level ?? "unknown",
        transitTime: r.transitTime ?? r.transit_time ?? "unknown",
        validUntil: r.validUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));


      const quoteDoc: any = {
        ...request,
        quotes: normalizedQuotes,
        quoteId: response?.quoteId || `QT-${Date.now()}`,
        status: response?.status || "success",
        createdAt: Date.now(),
      };

      if (orgId) quoteDoc.orgId = orgId;
      if (linkedUserId) quoteDoc.userId = linkedUserId;

      const docId = await ctx.db.insert("quotes", quoteDoc);

      return { quoteId: quoteDoc.quoteId, quotes: quoteDoc.quotes };
    } catch (error) {
      console.error("FAILED to create quote:", error);
      throw new Error(`Quote creation failed: ${(error as any).message}`);
    }
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
    orgId: v.optional(v.union(v.string(), v.null())), // New
  },
  handler: async (ctx, { request, orgId: argsOrgId }) => {
    const pricing = calculateShippingPrice({
      origin: request.origin,
      destination: request.destination,
      weight: request.weight,
      serviceType: request.serviceType,
      cargoType: request.cargoType,
    });

    const transitTime = estimateTransitTime(request.origin, request.destination, request.serviceType);

    let quotes: any[] = request.quotes || [];

    // DEBUG: Log incoming quotes to trace cost values
    console.log('📦 createInstantQuoteAndBooking - Incoming quotes:', quotes.length, 'rates');
    if (quotes.length > 0) {
      console.log('📦 Sample rate fields:', {
        first: quotes[0],
        hasPrice: !!quotes[0]?.price,
        hasCost: !!quotes[0]?.cost,
        hasAmount: !!quotes[0]?.amount,
        priceAmount: quotes[0]?.price?.amount,
        cost: quotes[0]?.cost,
        amount: quotes[0]?.amount,
      });
    }

    if (quotes.length === 0) {
      quotes = [{
        id: `rate-${Date.now()}`,
        carrier: "freightcode Logistics",
        service_level: request.serviceType || "Standard Freight",
        amount: pricing,
        currency: "USD",
        transit_time: transitTime,
        logo: "/logo.png"
      }];
    }

    const identity = await ctx.auth.getUserIdentity();
    let linkedUserId: any = null;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
        .unique();
      if (user) linkedUserId = user._id as any;
    }

    const orgId = argsOrgId || (identity as any)?.org_id;

    // STRICT NORMALIZATION - Handle Shippo format (cost) and legacy format (price.amount)
    const normalizedQuotes = quotes.map((r: any) => ({
      carrierId: r.carrierId ?? r.id ?? `carrier-${Date.now()}`,
      carrierName: r.carrierName ?? r.carrier ?? "freightcode Logistics",
      price: {
        // Handle Shippo format (cost) and legacy format (price.amount)
        amount: Number(r.price?.amount ?? r.cost ?? r.amount?.total ?? r.amount ?? 0),
        breakdown: {
          baseRate: Number(r.price?.breakdown?.baseRate ?? r.amount?.baseRate ?? r.amount ?? 0),
          documentation: Number(r.price?.breakdown?.documentation ?? r.amount?.documentation ?? 0),
          fuelSurcharge: Number(r.price?.breakdown?.fuelSurcharge ?? r.amount?.fuelSurcharge ?? 0),
          securityFee: Number(r.price?.breakdown?.securityFee ?? r.amount?.securityFee ?? 0),
        },
        currency: r.price?.currency ?? r.currency ?? "USD",
        // IMPORTANT: Preserve lineItems or generate mock breakdown (check for empty array too)
        lineItems: (r.price?.lineItems && r.price.lineItems.length > 0)
          ? r.price.lineItems
          : generateMockLineItems(request.origin, request.destination),
      },
      serviceType: (r.serviceType ?? r.service ?? r.service_level ?? r.serviceType) || "Standard Freight",
      transitTime: r.transitTime ?? r.transit_time ?? "3-5 days",
      validUntil: r.validUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));


    const quoteId = `QT-${Date.now()}`;
    const quoteDoc: any = {
      ...request,
      quoteId,
      status: "success",
      quotes: normalizedQuotes, // Use normalized
      userId: linkedUserId,
      createdAt: Date.now(),
    };

    if (orgId) quoteDoc.orgId = orgId;

    const docId = await ctx.db.insert("quotes", quoteDoc);

    return { quoteId, docId, quotes: normalizedQuotes };
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
        .withIndex("byOrgId", (q) => q.eq("orgId", orgId))
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
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .filter((q) => q.or(q.eq(q.field("orgId"), null), q.eq(q.field("orgId"), undefined)))
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
      .withIndex("byQuoteId", (q) => q.eq("quoteId", quoteId))
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
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
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

    // 3. Save Quote
    const quoteId = `QT-G-${Date.now()}`;
    await ctx.db.insert("quotes", {
      ...request,
      quoteId,
      status: "success",
      quotes,
      guestId,
      userId: undefined,
      orgId: undefined,
      createdAt: Date.now(),
    });

    return { quoteId, guestId, quotes };
  },
});
