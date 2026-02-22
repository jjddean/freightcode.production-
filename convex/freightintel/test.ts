import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const testScoring = action({
    args: {},
    handler: async (ctx) => {
        // Trigger scoring for all forwarders
        await ctx.runMutation(internal.freightintel.internal.recalculateAllScores, {});

        return { success: true, message: "Scoring recalculation scheduled for all profiles" };
    },
});

export const seedMockData = action({
    args: {},
    handler: async (ctx) => {
        const mockShipments = [
            {
                billOfLading: "BL-TEST-INDIA-1",
                shipper: "Mumbai Exports Ltd",
                consignee: "London Logistics Hub",
                forwarder: "Global Express Mumbai",
                originCountry: "India",
                destinationCountry: "United Kingdom",
                commodity: "Textiles",
                weight: 5000,
                shipmentDate: Date.now() - 10 * 24 * 60 * 60 * 1000,
            },
            {
                billOfLading: "BL-TEST-INDIA-2",
                shipper: "Delhi Traders",
                consignee: "British Retail Corp",
                forwarder: "Global Express Mumbai",
                originCountry: "India",
                destinationCountry: "United Kingdom",
                commodity: "Electronics",
                weight: 2000,
                shipmentDate: Date.now() - 5 * 24 * 60 * 60 * 1000,
            },
            {
                billOfLading: "BL-TEST-VIETNAM-1",
                shipper: "Hanoi Mfg",
                consignee: "Manchester Supply",
                forwarder: "Vietnam Ocean Freight",
                originCountry: "Vietnam",
                destinationCountry: "United Kingdom",
                commodity: "Furniture",
                weight: 8000,
                shipmentDate: Date.now() - 20 * 24 * 60 * 60 * 1000,
            },
            {
                billOfLading: "BL-TEST-CHINA-1",
                shipper: "Ningbo Solar",
                consignee: "EU Distribution (Rotterdam)",
                forwarder: "Ningbo Solar Logistics",
                originCountry: "China",
                destinationCountry: "Netherlands",
                commodity: "Solar Panels",
                weight: 15000,
                shipmentDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
            }
        ];

        console.log("Seeding mock shipments...");
        for (const shipment of mockShipments) {
            await ctx.runMutation(internal.freightintel.mutations.saveShipment, {
                ...shipment,
                dataSource: "test_seed",
            });
        }

        // Recalculate scores
        await ctx.runMutation(internal.freightintel.internal.recalculateAllScores, {});

        return { success: true, message: `Seeded ${mockShipments.length} mock shipments and triggered scoring.` };
    },
});
