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
                shipmentId: "SH-001",
                status: "IN_TRANSIT",
                carrier: "Maersk",
                trackingNumber: "MAEU123456",
                service: "Standard Ocean",
                shipmentDetails: {
                    origin: "CNSHA",
                    destination: "USLAX",
                    weight: "12000kg",
                    dimensions: "40HC",
                    value: "$45,000",
                },
                currentLocation: {
                    city: "Pacific Ocean",
                    state: "NA",
                    country: "INT",
                    coordinates: { lat: 34.05, lng: -118.24 }
                },
                estimatedDelivery: "2026-03-01T00:00:00Z",
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            },
            {
                shipmentId: "SH-002",
                status: "ARRIVED",
                carrier: "DHL",
                trackingNumber: "DHL789012",
                service: "Express Air",
                shipmentDetails: {
                    origin: "LHR",
                    destination: "JFK",
                    weight: "250kg",
                    dimensions: "3 Pallets",
                    value: "$125,000",
                },
                currentLocation: {
                    city: "New York",
                    state: "NY",
                    country: "USA",
                    coordinates: { lat: 40.71, lng: -74.00 }
                },
                estimatedDelivery: "2026-02-18T00:00:00Z",
                createdAt: Date.now(),
                lastUpdated: Date.now(),
            },
            {
                shipmentId: "SH-003",
                status: "CUSTOMS_HOLD",
                carrier: "MSC",
                trackingNumber: "MSCU987654",
                service: "Standard Ocean",
                shipmentDetails: {
                    origin: "NLRTM",
                    destination: "GBSOU",
                    weight: "18000kg",
                    dimensions: "20GP",
                    value: "$12,000",
                },
                currentLocation: {
                    city: "Southampton",
                    state: "Hampshire",
                    country: "UK",
                    coordinates: { lat: 50.90, lng: -1.40 }
                },
                estimatedDelivery: "2026-02-20T00:00:00Z",
                riskLevel: "high",
                flagReason: "HS Code Mismatch Detected by SmartAudit",
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
