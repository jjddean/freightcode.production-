import { internalMutation } from "./_generated/server";

export const seedContracts = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Clear existing
        const existing = await ctx.db.query("contracts").collect();
        for (const c of existing) await ctx.db.delete(c._id);

        // 2. Insert Standard Contracts (NACs)
        await ctx.db.insert("contracts", {
            carrier: "Maersk",
            origin: "CNSHA",
            destination: "USLAX",
            containerType: "40HC",
            price: 2200,
            currency: "USD",
            effectiveDate: "2026-01-01",
            expirationDate: "2026-12-31"
        });

        await ctx.db.insert("contracts", {
            carrier: "MSC",
            origin: "CNSHA",
            destination: "NLRTM",
            containerType: "40HC",
            price: 1800,
            currency: "USD",
            effectiveDate: "2026-01-01",
            expirationDate: "2026-12-31"
        });

        return "Seeded 2 Contracts (Maersk & MSC)";
    }
});

export const seedDffShipments = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Clear existing
        const existing = await ctx.db.query("shipments").collect();
        for (const s of existing) await ctx.db.delete(s._id);
        const existingEvents = await ctx.db.query("trackingEvents").collect();
        for (const e of existingEvents) await ctx.db.delete(e._id);

        // 2. Insert Samples
        const shipments = [
            {
                shipmentId: "SH-HMRC-01",
                status: "ARRIVED",
                carrier: "Maersk",
                trackingNumber: "MAEU123456",
                service: "Standard Ocean",
                shipmentDetails: {
                    origin: "CNSHA",
                    destination: "GBSOU",
                    weight: "12000kg",
                    dimensions: "40HC",
                    value: "45000",
                },
                customs: {
                    filingStatus: "pending",
                    entryNumber: "GB202698765432",
                    eoriNumber: "GB853432453900", // User's Test EORI
                },
                currentLocation: {
                    city: "Southampton",
                    country: "UK",
                },
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            },
            {
                shipmentId: "SH-HMRC-02",
                status: "CUSTOMS_HOLD",
                carrier: "MSC",
                trackingNumber: "MSCU987654",
                service: "Standard Ocean",
                shipmentDetails: {
                    origin: "NLRTM",
                    destination: "GBSOU",
                    weight: "18000kg",
                    dimensions: "20GP",
                    value: "12000",
                },
                customs: {
                    filingStatus: "review",
                    entryNumber: "GB202611223344",
                    eoriNumber: "GB853432453900", // User's Test EORI
                },
                riskLevel: "high",
                flagReason: "HS Code Mismatch Detected by SmartAudit",
                currentLocation: {
                    city: "Southampton",
                    country: "UK",
                },
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            }
        ];

        for (const s of shipments) {
            await ctx.db.insert("shipments", s as any);
        }

        return `Seeded ${shipments.length} Shipments`;
    }
});
