
import { internalMutation, internalAction } from "./_generated/server";
import { getFreightEstimates } from "./freightos";

export const createManualBooking = internalMutation({
    args: {},
    handler: async (ctx) => {
        // minimalist booking
        return await ctx.db.insert("bookings", {
            bookingId: "TEST-MANUAL-" + Date.now(),
            quoteId: "Q-MANUAL",
            carrierQuoteId: "CQ-1",
            status: "pending_approval",
            customerDetails: {
                name: "Manual Test",
                email: "manual@test.com",
                phone: "123",
                company: "Test Co"
            },
            pickupDetails: {
                address: "Origin",
                date: "2026-01-01",
                timeWindow: "Any",
                contactPerson: "A",
                contactPhone: "1"
            },
            deliveryDetails: {
                address: "Dest",
                date: "2026-01-02",
                timeWindow: "Any",
                contactPerson: "B",
                contactPhone: "2"
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    }
});

export const testFreightosIntegration = internalAction({
    args: {},
    handler: async (ctx) => {
        console.log("Testing Freightos Integration...");

        // Test Case: Valid Request
        const request = {
            origin: "USLAX",
            destination: "CNSHA",
            load: [{
                quantity: 1,
                unitType: "container20" as const,
                unitWeightKg: 1000,
                unitVolumeCBM: 33
            }]
        };

        try {
            const result = await getFreightEstimates(request);
            console.log("Freightos Response:", JSON.stringify(result, null, 2));

            if (!result) throw new Error("No response from Freightos");
            if (!result.OCEAN && !result.AIR) throw new Error("Response missing estimates");

            return { success: true, data: result, keyUsed: !!process.env.FREIGHTOS_API_KEY };
        } catch (error: any) {
            console.error("Freightos Test Failed:", error);
            return { success: false, error: error.message };
        }
    }
});


